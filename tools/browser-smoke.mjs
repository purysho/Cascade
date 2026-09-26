import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const verification = resolve(root, "verification");
const profile = resolve(root, ".browser-smoke-profile");
mkdirSync(verification, { recursive: true });
rmSync(profile, { recursive: true, force: true });

const server = spawn(process.execPath, [resolve(root, "tools/serve-web.mjs")], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
const driver = spawn("chromedriver", ["--port=9515", "--silent"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});

const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));
const fail = message => { throw new Error(message); };

async function available(url) {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  fail("Timed out waiting for " + url);
}

async function webdriver(path, method = "GET", body) {
  const response = await fetch("http://127.0.0.1:9515" + path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || payload.value?.error) {
    fail(`WebDriver ${method} ${path}: ${JSON.stringify(payload.value ?? payload)}`);
  }
  return payload.value;
}

const elementKey = "element-6066-11e4-a52e-4f735466cecf";
async function find(session, selector) {
  const result = await webdriver(`/session/${session}/element`, "POST", { using: "css selector", value: selector });
  return result[elementKey];
}
async function waitElement(session, selector) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { return await find(session, selector); } catch {}
    await wait(100);
  }
  fail("Timed out waiting for element " + selector);
}
async function text(session, selector) {
  const id = await waitElement(session, selector);
  return webdriver(`/session/${session}/element/${id}/text`);
}
async function click(session, selector) {
  const id = await waitElement(session, selector);
  await webdriver(`/session/${session}/element/${id}/click`, "POST", {});
}
async function setValue(session, selector, value) {
  const id = await waitElement(session, selector);
  await webdriver(`/session/${session}/element/${id}/clear`, "POST", {});
  await webdriver(`/session/${session}/element/${id}/value`, "POST", { text: value, value: [...value] });
}
async function waitText(session, selector, expected) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if ((await text(session, selector)) === expected) return;
    await wait(100);
  }
  fail(`Expected ${selector} to read "${expected}", got "${await text(session, selector)}"`);
}

let session;
try {
  await Promise.all([
    available("http://127.0.0.1:4173/"),
    available("http://127.0.0.1:9515/status"),
  ]);

  const created = await webdriver("/session", "POST", {
    capabilities: {
      alwaysMatch: {
        browserName: "chrome",
        "goog:chromeOptions": {
          args: [
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--window-size=1440,900",
            "--force-device-scale-factor=1",
            `--user-data-dir=${profile}`,
          ],
        },
        "goog:loggingPrefs": { browser: "ALL" },
      },
    },
  });
  session = created.sessionId;
  if (!session) fail("ChromeDriver did not return a session ID.");

  await webdriver(`/session/${session}/url`, "POST", { url: "http://127.0.0.1:4173/" });
  await waitElement(session, "#start-generated");
  await setValue(session, "#seed-input", "BROWSER-SMOKE");
  await click(session, "#start-generated");
  await waitText(session, "#run-code", "BROWSER-SMOKE");
  await waitText(session, "#round-value", "1/12");

  await click(session, ".draft-card");
  await waitElement(session, ".action-button:not([disabled])");
  await waitText(session, "#ap-value", "3/3");

  await click(session, ".action-button:not([disabled])");
  await waitText(session, "#ap-value", "2/3");
  await click(session, "#undo");
  await waitText(session, "#ap-value", "3/3");

  await click(session, "#commit");
  await waitText(session, "#round-value", "2/12");
  const eventText = await text(session, "#event-log");
  if (!eventText.trim()) fail("Causal event log remained empty after committing a round.");

  await webdriver(`/session/${session}/url`, "POST", { url: "http://127.0.0.1:4173/" });
  const resume = await waitElement(session, "#resume-game");
  const hidden = await webdriver(`/session/${session}/element/${resume}/property/hidden`);
  if (hidden === true) fail("Saved incident was not offered after a reload.");
  await webdriver(`/session/${session}/element/${resume}/click`, "POST", {});
  await waitText(session, "#round-value", "2/12");
  await waitText(session, "#run-code", "BROWSER-SMOKE");

  const screenshot = await webdriver(`/session/${session}/screenshot`);
  writeFileSync(resolve(verification, "browser-smoke.png"), Buffer.from(screenshot, "base64"));

  let logs = [];
  try {
    logs = await webdriver(`/session/${session}/se/log`, "POST", { type: "browser" });
  } catch (error) {
    console.warn("Browser console log endpoint unavailable:", error instanceof Error ? error.message : error);
  }
  const severe = Array.isArray(logs) ? logs.filter(entry => entry.level === "SEVERE") : [];
  if (severe.length) fail("Browser console contained SEVERE entries: " + JSON.stringify(severe));

  const viewport = await webdriver(`/session/${session}/execute/sync`, "POST", {
    script: "return { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio };",
    args: [],
  });
  if (viewport.width < 1200 || viewport.height < 700) fail("Browser viewport is smaller than the supported desktop smoke target.");

  console.log(JSON.stringify({
    browser: "Google Chrome via ChromeDriver",
    viewport,
    flow: ["entry", "seeded run", "tool draft", "legal action", "undo", "commit", "save", "reload", "resume"],
    roundAfterResume: await text(session, "#round-value"),
    screenshot: "verification/browser-smoke.png",
    severeConsoleEntries: severe.length,
  }, null, 2));
} finally {
  if (session) {
    try { await webdriver(`/session/${session}`, "DELETE"); } catch {}
  }
  server.kill("SIGTERM");
  driver.kill("SIGTERM");
  rmSync(profile, { recursive: true, force: true });
}

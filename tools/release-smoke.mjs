import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { extractStoreZip } from "./release-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const release = resolve(root, "release");
const verification = resolve(root, "verification");
const profile = resolve(root, ".release-browser-profile");
const extractDir = resolve(root, ".release-browser-extract");
mkdirSync(verification, { recursive: true });
rmSync(profile, { recursive: true, force: true });
rmSync(extractDir, { recursive: true, force: true });

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const zip = readFileSync(resolve(release, `Cascade-v${pkg.version}.zip`));
extractStoreZip(zip, extractDir);
const playableUrl = pathToFileURL(resolve(extractDir, "Cascade-Play.html")).href;

const driver = spawn("chromedriver", ["--port=9517", "--silent"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});

const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));
const fail = message => { throw new Error(message); };

async function available(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  fail("Timed out waiting for " + url);
}

async function webdriver(path, method = "GET", body) {
  const response = await fetch("http://127.0.0.1:9517" + path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || payload.value?.error) fail(`WebDriver ${method} ${path}: ${JSON.stringify(payload.value ?? payload)}`);
  return payload.value;
}

const elementKey = "element-6066-11e4-a52e-4f735466cecf";
async function find(session, selector) {
  const result = await webdriver(`/session/${session}/element`, "POST", { using: "css selector", value: selector });
  return result[elementKey];
}
async function waitElement(session, selector) {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { return await find(session, selector); } catch {}
    await wait(100);
  }
  fail("Timed out waiting for " + selector);
}
async function text(session, selector) {
  const id = await waitElement(session, selector);
  return webdriver(`/session/${session}/element/${id}/text`);
}
async function click(session, selector) {
  const id = await waitElement(session, selector);
  await webdriver(`/session/${session}/execute/sync`, "POST", {
    script: "arguments[0].scrollIntoView({block:'center',inline:'center'});",
    args: [{ [elementKey]: id }],
  });
  await wait(40);
  await webdriver(`/session/${session}/element/${id}/click`, "POST", {});
}
async function waitText(session, selector, expected) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if ((await text(session, selector)) === expected) return;
    await wait(100);
  }
  fail(`Expected ${selector} to read "${expected}", got "${await text(session, selector)}"`);
}

let session;
try {
  await available("http://127.0.0.1:9517/status");
  const created = await webdriver("/session", "POST", {
    capabilities: {
      alwaysMatch: {
        browserName: "chrome",
        "goog:chromeOptions": {
          args: [
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-background-networking",
            "--allow-file-access-from-files",
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

  await webdriver(`/session/${session}/url`, "POST", { url: playableUrl });
  await waitElement(session, "#start-generated");
  await click(session, '[data-scenario="overdrive"]');
  await waitText(session, "#round-value", "1/12");
  await click(session, ".action-button:not([disabled])");
  await click(session, "#undo");
  await waitText(session, "#ap-value", "3/3");
  await click(session, "#commit");
  await waitText(session, "#round-value", "2/12");

  // The extracted file itself must persist and resume a campaign.
  await webdriver(`/session/${session}/url`, "POST", { url: playableUrl });
  const resumeId = await waitElement(session, "#resume-game");
  const hidden = await webdriver(`/session/${session}/element/${resumeId}/property/hidden`);
  if (hidden === true) fail("Extracted file:// build did not offer the saved incident.");
  await webdriver(`/session/${session}/element/${resumeId}/click`, "POST", {});
  await waitText(session, "#round-value", "2/12");

  // Training also has to load from the same embedded module graph.
  await webdriver(`/session/${session}/url`, "POST", { url: playableUrl });
  await click(session, "#start-tutorial");
  await waitText(session, "#tutorial-title", "Read the danger");

  const screenshot = await webdriver(`/session/${session}/screenshot`);
  writeFileSync(resolve(verification, "release-file-smoke.png"), Buffer.from(screenshot, "base64"));

  let logs = [];
  try { logs = await webdriver(`/session/${session}/se/log`, "POST", { type: "browser" }); } catch {}
  const severe = Array.isArray(logs) ? logs.filter(entry => entry.level === "SEVERE") : [];
  if (severe.length) fail("Extracted file:// build contained SEVERE console entries: " + JSON.stringify(severe));

  console.log(JSON.stringify({
    playableUrl,
    entry: "pass",
    actionUndoCommit: "pass",
    fileSaveReloadResume: "pass",
    embeddedTutorial: "pass",
    screenshot: "verification/release-file-smoke.png",
    severeConsoleEntries: severe.length,
  }, null, 2));
} finally {
  if (session) {
    try { await webdriver(`/session/${session}`, "DELETE"); } catch {}
  }
  driver.kill("SIGTERM");
  rmSync(profile, { recursive: true, force: true });
}

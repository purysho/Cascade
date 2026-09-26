import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const verification = resolve(root, "verification");
mkdirSync(verification, { recursive: true });

const browser = (process.env.CASCADE_BROWSER ?? "edge").toLowerCase();
const port = 9516;
const profile = resolve(root, `.platform-browser-profile-${browser}`);
rmSync(profile, { recursive: true, force: true });

function driverFromEnv(envName, executable, fallback) {
  const location = process.env[envName];
  if (!location) return fallback;
  if (basename(location).toLowerCase().includes("driver")) return location;
  return resolve(location, executable);
}

let driverCommand;
let driverArgs;
let capabilities;

if (browser === "edge") {
  driverCommand = driverFromEnv("EDGEWEBDRIVER", process.platform === "win32" ? "msedgedriver.exe" : "msedgedriver", "msedgedriver");
  driverArgs = [`--port=${port}`, "--silent"];
  capabilities = {
    browserName: "MicrosoftEdge",
    "ms:edgeOptions": {
      args: ["--headless=new", "--disable-gpu", "--window-size=1366,911", `--user-data-dir=${profile}`],
    },
  };
} else if (browser === "firefox") {
  driverCommand = driverFromEnv("GECKOWEBDRIVER", process.platform === "win32" ? "geckodriver.exe" : "geckodriver", "geckodriver");
  driverArgs = ["--port", String(port), "--log", "fatal"];
  capabilities = {
    browserName: "firefox",
    "moz:firefoxOptions": { args: ["-headless"] },
  };
} else if (browser === "chrome") {
  driverCommand = driverFromEnv("CHROMEWEBDRIVER", process.platform === "win32" ? "chromedriver.exe" : "chromedriver", "chromedriver");
  driverArgs = [`--port=${port}`, "--silent"];
  capabilities = {
    browserName: "chrome",
    "goog:chromeOptions": {
      args: ["--headless=new", "--disable-gpu", "--window-size=1366,911", `--user-data-dir=${profile}`],
    },
  };
} else {
  throw new Error("Unsupported CASCADE_BROWSER: " + browser);
}

const server = spawn(process.execPath, [resolve(root, "tools/serve-web.mjs")], {
  cwd: root,
  env: { ...process.env, PORT: "4173" },
  stdio: ["ignore", "pipe", "pipe"],
});
const driver = spawn(driverCommand, driverArgs, {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});

const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));
const fail = message => { throw new Error(message); };

async function available(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  fail("Timed out waiting for " + url);
}

async function webdriver(path, method = "GET", body) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
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
  for (let attempt = 0; attempt < 70; attempt++) {
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
  for (let attempt = 0; attempt < 70; attempt++) {
    if ((await text(session, selector)) === expected) return;
    await wait(100);
  }
  fail(`Expected ${selector} to read "${expected}", got "${await text(session, selector)}"`);
}

let session;
try {
  await Promise.all([
    available("http://127.0.0.1:4173/"),
    available(`http://127.0.0.1:${port}/status`),
  ]);

  const created = await webdriver("/session", "POST", {
    capabilities: { alwaysMatch: capabilities },
  });
  session = created.sessionId;
  if (!session) fail("Driver did not return a session ID.");

  try {
    await webdriver(`/session/${session}/window/rect`, "POST", { width: 1366, height: 911, x: 0, y: 0 });
  } catch {}

  await webdriver(`/session/${session}/url`, "POST", { url: "http://127.0.0.1:4173/" });
  await waitElement(session, "#start-generated");
  await click(session, "#start-sound-toggle");
  await waitText(session, "#start-sound-toggle", "Sound: Muted");
  await click(session, '[data-scenario="overdrive"]');
  await waitText(session, "#round-value", "1/12");
  await click(session, ".action-button:not([disabled])");
  await click(session, "#undo");
  await waitText(session, "#ap-value", "3/3");
  await click(session, "#commit");
  await waitText(session, "#round-value", "2/12");

  const viewport = await webdriver(`/session/${session}/execute/sync`, "POST", {
    script: "return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio,title:document.title};",
    args: [],
  });
  if (viewport.width < 1200 || viewport.height < 700) fail("Unexpectedly small browser viewport: " + JSON.stringify(viewport));

  const image = await webdriver(`/session/${session}/screenshot`);
  const fileName = `platform-${process.platform}-${browser}.png`;
  writeFileSync(resolve(verification, fileName), Buffer.from(image, "base64"));

  console.log(JSON.stringify({
    platform: process.platform,
    browser,
    driver: driverCommand,
    viewport,
    flow: ["entry", "mute", "authored run", "legal action", "undo", "commit"],
    screenshot: `verification/${fileName}`,
  }, null, 2));
} finally {
  if (session) {
    try { await webdriver(`/session/${session}`, "DELETE"); } catch {}
  }
  server.kill("SIGTERM");
  driver.kill("SIGTERM");
  rmSync(profile, { recursive: true, force: true });
}

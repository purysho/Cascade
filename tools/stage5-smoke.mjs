import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const verification = resolve(root, "verification");
const profile = resolve(root, ".stage5-browser-profile");
mkdirSync(verification, { recursive: true });
rmSync(profile, { recursive: true, force: true });

const witnessData = JSON.parse(readFileSync(resolve(root, "design/engine-witnesses-v0.2.json"), "utf8"));
const witness = witnessData.witnesses.find(entry => entry.id === "overdrive");
if (!witness) throw new Error("Missing overdrive recovery witness.");

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
  for (let attempt = 0; attempt < 60; attempt++) {
    try { return await find(session, selector); } catch {}
    await wait(100);
  }
  fail("Timed out waiting for element " + selector);
}

async function text(session, selector) {
  const id = await waitElement(session, selector);
  return webdriver(`/session/${session}/element/${id}/text`);
}

async function property(session, selector, name) {
  const id = await waitElement(session, selector);
  return webdriver(`/session/${session}/element/${id}/property/${name}`);
}

async function click(session, selector) {
  const id = await waitElement(session, selector);
  await webdriver(`/session/${session}/execute/sync`, "POST", {
    script: "arguments[0].scrollIntoView({ block: 'center', inline: 'center' });",
    args: [{ [elementKey]: id }],
  });
  await wait(40);
  await webdriver(`/session/${session}/element/${id}/click`, "POST", {});
}

async function key(session, selector, keyValue) {
  const id = await waitElement(session, selector);
  await webdriver(`/session/${session}/execute/sync`, "POST", {
    script: "arguments[0].focus();",
    args: [{ [elementKey]: id }],
  });
  await webdriver(`/session/${session}/element/${id}/value`, "POST", { text: keyValue, value: [keyValue] });
}

async function setValue(session, selector, value) {
  const id = await waitElement(session, selector);
  await webdriver(`/session/${session}/element/${id}/clear`, "POST", {});
  await webdriver(`/session/${session}/element/${id}/value`, "POST", { text: value, value: [...value] });
}

async function waitText(session, selector, expected) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if ((await text(session, selector)) === expected) return;
    await wait(100);
  }
  fail(`Expected ${selector} to read "${expected}", got "${await text(session, selector)}"`);
}

async function waitContains(session, selector, expected) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const current = await text(session, selector);
    if (current.includes(expected)) return current;
    await wait(100);
  }
  fail(`Expected ${selector} to contain "${expected}", got "${await text(session, selector)}"`);
}

async function waitProperty(session, selector, name, expected) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if ((await property(session, selector, name)) === expected) return;
    await wait(100);
  }
  fail(`Expected ${selector} property ${name} to equal ${JSON.stringify(expected)}`);
}

async function execute(session, script, args = []) {
  return webdriver(`/session/${session}/execute/sync`, "POST", { script, args });
}

async function screenshot(session, fileName) {
  const image = await webdriver(`/session/${session}/screenshot`);
  writeFileSync(resolve(verification, fileName), Buffer.from(image, "base64"));
}

async function runWitnessOperation(session, operation) {
  if (operation.target) await click(session, `[data-service="${operation.target}"]`);
  await click(session, `.action-button[data-action="${operation.action}"]:not([disabled])`);
}

async function dialogOpen(session, selector) {
  return (await property(session, selector, "open")) === true;
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
            "--window-size=1366,911",
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

  const compactViewport = await execute(session, "return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio};");
  if (compactViewport.width < 1360 || compactViewport.height < 760) {
    fail("1366x768-class viewport was not reached: " + JSON.stringify(compactViewport));
  }

  // Keyboard-only help and focus return.
  await key(session, "#start-help", "\uE007");
  await waitProperty(session, "#help-modal", "open", true);
  await key(session, "#close-help", "\uE007");
  await waitProperty(session, "#help-modal", "open", false);
  const focusAfterHelp = await execute(session, "return document.activeElement && document.activeElement.id;");
  if (focusAfterHelp !== "start-help") fail("Help dialog did not restore focus to its keyboard invoker.");

  // Complete a full authored win using the already engine-verified recovery witness.
  await click(session, '[data-scenario="overdrive"]');
  await waitText(session, "#round-value", "1/12");
  for (let roundIndex = 0; roundIndex < witness.plans.length; roundIndex++) {
    for (const operation of witness.plans[roundIndex]) await runWitnessOperation(session, operation);
    await click(session, "#commit");
    await wait(120);
    if (await dialogOpen(session, "#result-modal")) break;
    await waitText(session, "#round-value", `${roundIndex + 2}/12`);
  }
  await waitText(session, "#result-title", "CONTROL RESTORED");
  await screenshot(session, "stage5-win.png");

  // Same-crisis replay must restart from the initial state.
  await click(session, "#result-same");
  await waitText(session, "#round-value", "1/12");
  await waitText(session, "#run-code", "PRACTICE-OVERDRIVE");

  // A no-intervention replay reaches a real loss ending.
  for (let attempt = 0; attempt < 12; attempt++) {
    await click(session, "#commit");
    await wait(120);
    if (await dialogOpen(session, "#result-modal")) break;
  }
  await waitText(session, "#result-title", "CITY OVERWHELMED");
  await screenshot(session, "stage5-loss.png");
  await click(session, "#result-menu");
  await waitElement(session, "#start-generated");

  // Newer-tab conflict: a foreign save token must pause autosave without
  // stopping the in-memory run.
  await setValue(session, "#seed-input", "STAGE5-CONFLICT");
  await click(session, "#start-generated");
  await click(session, ".draft-card");
  await click(session, ".action-button:not([disabled])");
  const savedBeforeConflict = await execute(session, "return localStorage.getItem('cascade.save.v1');");
  await execute(session, `
    localStorage.setItem('cascade.save.meta.v1', JSON.stringify({
      token: 'foreign-newer-token',
      tabId: 'other-tab',
      revision: 999,
      savedAt: Date.now() + 1000
    }));
  `);
  await click(session, ".action-button:not([disabled])");
  await waitContains(session, "#toast", "newer browser tab");
  const savedAfterConflict = await execute(session, "return localStorage.getItem('cascade.save.v1');");
  if (savedAfterConflict !== savedBeforeConflict) fail("Conflict guard allowed the stale tab to overwrite the saved replay.");
  await screenshot(session, "stage5-conflict.png");

  // 200% zoom: primary round control remains reachable after scrolling.
  await execute(session, "document.documentElement.style.zoom='2'; document.querySelector('#commit').scrollIntoView({block:'center',inline:'center'});");
  const zoomRect = await execute(session, "const r=document.querySelector('#commit').getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,innerWidth,innerHeight};");
  if (zoomRect.width <= 0 || zoomRect.height <= 0 || zoomRect.right <= 0 || zoomRect.left >= zoomRect.innerWidth) {
    fail("End Round control became unreachable at 200% zoom: " + JSON.stringify(zoomRect));
  }
  await screenshot(session, "stage5-zoom-200.png");
  await execute(session, "document.documentElement.style.zoom='';");

  // Reduced motion stays available as a presentation-only preference.
  await click(session, "#motion-toggle");
  await waitText(session, "#motion-toggle", "Motion: Reduced");

  // 1920x1080-class desktop viewport.
  await webdriver(`/session/${session}/window/rect`, "POST", { width: 1920, height: 1223, x: 0, y: 0 });
  await wait(100);
  const largeViewport = await execute(session, "return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio};");
  if (largeViewport.width < 1900 || largeViewport.height < 1060) {
    fail("1920x1080-class viewport was not reached: " + JSON.stringify(largeViewport));
  }
  await screenshot(session, "stage5-1920.png");

  // Corrupted JSON must be ignored rather than trusted or crashing entry.
  await execute(session, "localStorage.setItem('cascade.save.v1', '{broken-json'); localStorage.removeItem('cascade.save.meta.v1');");
  await webdriver(`/session/${session}/url`, "POST", { url: "http://127.0.0.1:4173/" });
  await waitElement(session, "#start-generated");
  const resumeHidden = await property(session, "#resume-game", "hidden");
  if (resumeHidden !== true) fail("Corrupted save was offered for resume.");

  // Storage write failures must leave the current run playable in memory.
  await execute(session, "window.__originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError');};");
  await click(session, '[data-scenario="overdrive"]');
  await waitText(session, "#round-value", "1/12");
  await waitContains(session, "#toast", "storage is unavailable");
  await click(session, ".action-button:not([disabled])");
  const apAfterStorageFailure = await text(session, "#ap-value");
  if (apAfterStorageFailure === "3/3") fail("Run did not remain interactive after storage failure.");

  let logs = [];
  try {
    logs = await webdriver(`/session/${session}/se/log`, "POST", { type: "browser" });
  } catch {}
  const severe = Array.isArray(logs) ? logs.filter(entry => entry.level === "SEVERE") : [];
  if (severe.length) fail("Stage 5 browser flow contained SEVERE console entries: " + JSON.stringify(severe));

  console.log(JSON.stringify({
    browser: "Google Chrome via ChromeDriver",
    compactViewport,
    largeViewport,
    keyboardHelpFocusReturn: "pass",
    completeWinReplay: "pass",
    completeLoss: "pass",
    newerTabConflictGuard: "pass",
    zoom200PrimaryControlReachable: "pass",
    reducedMotionControl: "pass",
    corruptedSaveRejected: "pass",
    storageFailureKeepsRunPlayable: "pass",
    screenshots: [
      "verification/stage5-win.png",
      "verification/stage5-loss.png",
      "verification/stage5-conflict.png",
      "verification/stage5-zoom-200.png",
      "verification/stage5-1920.png",
    ],
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

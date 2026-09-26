import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "verification/public-launch");
const profile = resolve(root, ".capture-profile");
mkdirSync(out, { recursive: true });
rmSync(profile, { recursive: true, force: true });

const server = spawn(process.execPath, [resolve(root, "tools/serve-web.mjs")], { cwd: root, stdio: "ignore" });
const driver = spawn("chromedriver", ["--port=9518", "--silent"], { cwd: root, stdio: "ignore" });
const wait = ms => new Promise(r => setTimeout(r, ms));
const elementKey = "element-6066-11e4-a52e-4f735466cecf";

async function available(url) {
  for (let i=0;i<100;i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await wait(100);
  }
  throw new Error("Timed out: " + url);
}
async function wd(path, method="GET", body) {
  const r = await fetch("http://127.0.0.1:9518"+path,{method,headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  const p = await r.json();
  if (!r.ok || p.value?.error) throw new Error(JSON.stringify(p.value ?? p));
  return p.value;
}
async function find(session, selector) {
  const v = await wd(`/session/${session}/element`,"POST",{using:"css selector",value:selector});
  return v[elementKey];
}
async function click(session, selector) {
  const id = await find(session,selector);
  await wd(`/session/${session}/execute/sync`,"POST",{script:"arguments[0].scrollIntoView({block:'center'});",args:[{[elementKey]:id}]});
  await wait(50);
  await wd(`/session/${session}/element/${id}/click`,"POST",{});
}
async function shot(session,name) {
  const b64 = await wd(`/session/${session}/screenshot`);
  writeFileSync(resolve(out,name),Buffer.from(b64,"base64"));
}
async function exec(session,script,args=[]) { return wd(`/session/${session}/execute/sync`,"POST",{script,args}); }

let session;
try {
  await Promise.all([available("http://127.0.0.1:4173/"),available("http://127.0.0.1:9518/status")]);
  const created = await wd("/session","POST",{capabilities:{alwaysMatch:{browserName:"chrome","goog:chromeOptions":{args:["--headless=new","--no-sandbox","--disable-gpu","--window-size=1920,1223","--force-device-scale-factor=1",`--user-data-dir=${profile}`]}}}});
  session = created.sessionId;
  await wd(`/session/${session}/url`,"POST",{url:"http://127.0.0.1:4173/"});
  await wait(450);
  await shot(session,"cascade-boot.png");
  await wait(1250);
  await exec(session,"document.documentElement.style.zoom='0.9';");
  await shot(session,"cascade-menu.png");

  await click(session,'[data-scenario="overdrive"]');
  await wait(250);
  await click(session,'[data-service="grid"]');
  await shot(session,"cascade-live-city.png");

  const buttons = await wd(`/session/${session}/elements`,"POST",{using:"css selector",value:'.action-button:not([disabled])'});
  if (buttons.length) {
    await wd(`/session/${session}/element/${buttons[0][elementKey]}/click`,"POST",{});
    await wait(100);
  }
  await shot(session,"cascade-decision.png");

  await wd(`/session/${session}/url`,"POST",{url:"http://127.0.0.1:4173/"});
  await wait(1700);
  await click(session,"#start-tutorial");
  await wait(180);
  await shot(session,"cascade-training.png");

  console.log(JSON.stringify({screenshots:["cascade-menu.png","cascade-live-city.png","cascade-decision.png","cascade-training.png"]},null,2));
} finally {
  if (session) try { await wd(`/session/${session}`,"DELETE"); } catch {}
  server.kill("SIGTERM"); driver.kill("SIGTERM");
  rmSync(profile,{recursive:true,force:true});
}

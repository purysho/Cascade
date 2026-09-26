import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist-web");
rmSync(out, { recursive: true, force: true });

execFileSync(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "-p", resolve(root, "tsconfig.web.json")], {
  cwd: root,
  stdio: "inherit",
});

mkdirSync(resolve(out, "web"), { recursive: true });
cpSync(resolve(root, "web/index.html"), resolve(out, "index.html"));
cpSync(resolve(root, "web/styles.css"), resolve(out, "web/styles.css"));

const required = [
  "index.html",
  "web/app.js",
  "web/styles.css",
  "src/index.js",
  "design/rules-v0.2.json",
  "design/scenarios-v0.1.json",
  "design/tutorials-v0.1.json",
  "design/engine-witnesses-v0.2.json",
  "design/worked-traces-v0.1.json",
];
for (const relative of required) {
  if (!existsSync(resolve(out, relative))) throw new Error(`Browser build is missing ${relative}`);
}

const html = readFileSync(resolve(out, "index.html"), "utf8");
if (!html.includes('src="./web/app.js"')) throw new Error("Browser entry script is not wired to the built app.");
if (/https?:\/\//i.test(html)) throw new Error("Browser entry unexpectedly depends on a remote URL.");

console.log(`Cascade browser build verified: ${required.length} required files present in dist-web/.`);

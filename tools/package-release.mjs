import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, posix, relative, resolve, sep } from "node:path";
import { CONTENT_HASH, RULES } from "../src/index.ts";
import { CONTENT_VERSION } from "../src/content/catalog.ts";
import { GENERATOR_VERSION } from "../src/domain/generate.ts";
import { createStoreZip } from "./release-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist-web");
const release = resolve(root, "release");
if (!existsSync(resolve(dist, "index.html"))) throw new Error("dist-web is missing. Run npm run web:build first.");

rmSync(release, { recursive: true, force: true });
mkdirSync(release, { recursive: true });

function slash(path) {
  return path.split(sep).join("/");
}

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const full = resolve(directory, name);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (stat.isFile()) files.push(full);
  }
  return files;
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function sourceCommit() {
  if (process.env.CASCADE_SOURCE_COMMIT?.trim()) return process.env.CASCADE_SOURCE_COMMIT.trim();
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function syntheticSpecifier(relativePath) {
  return "cascade/" + relativePath.replace(/^\.\//, "");
}

function resolveImport(currentRelative, specifier) {
  const resolved = posix.normalize(posix.join(posix.dirname(currentRelative), specifier));
  if (resolved.startsWith("../") || resolved === "..") throw new Error(`Import escaped package root: ${currentRelative} -> ${specifier}`);
  return resolved;
}

function transformModule(source, relativePath) {
  let result = source;

  // TypeScript preserves JSON import attributes in the browser build. The
  // self-contained package maps JSON to generated JavaScript modules, so
  // remove the attribute after redirecting the specifier.
  result = result.replace(
    /from\s+["'](\.\.?\/[^"']+\.json)["']\s+with\s+\{\s*type\s*:\s*["']json["']\s*\}/g,
    (_match, specifier) => `from "${syntheticSpecifier(resolveImport(relativePath, specifier))}"`,
  );

  result = result.replace(
    /(from\s+)(["'])(\.\.?\/[^"']+)\2/g,
    (_match, prefix, _quote, specifier) => `${prefix}"${syntheticSpecifier(resolveImport(relativePath, specifier))}"`,
  );

  result = result.replace(
    /(import\s+)(["'])(\.\.?\/[^"']+)\2/g,
    (_match, prefix, _quote, specifier) => `${prefix}"${syntheticSpecifier(resolveImport(relativePath, specifier))}"`,
  );

  return result;
}

function dataModule(source) {
  return "data:text/javascript;base64," + Buffer.from(source, "utf8").toString("base64");
}

const importMap = { imports: {} };
const distFiles = walk(dist);
const jsFiles = distFiles.filter(file => file.endsWith(".js"));
const jsonFiles = distFiles.filter(file => file.endsWith(".json"));

for (const file of jsFiles) {
  const rel = slash(relative(dist, file));
  const transformed = transformModule(readFileSync(file, "utf8"), rel);
  importMap.imports[syntheticSpecifier(rel)] = dataModule(transformed);
}

for (const file of jsonFiles) {
  const rel = slash(relative(dist, file));
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  importMap.imports[syntheticSpecifier(rel)] = dataModule(`export default ${JSON.stringify(parsed)};\n`);
}

if (!importMap.imports["cascade/web/app.js"]) throw new Error("Self-contained entry module was not generated.");

let html = readFileSync(resolve(dist, "index.html"), "utf8");
const css = readFileSync(resolve(dist, "web/styles.css"), "utf8");
html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']\.\/web\/styles\.css["']\s*>/, `<style>\n${css}\n</style>`);
html = html.replace(
  /<script\s+type=["']module["']\s+src=["']\.\/web\/app\.js["']><\/script>/,
  `<script type="importmap">${JSON.stringify(importMap)}</script>\n  <script type="module">import "cascade/web/app.js";</script>`,
);
if (html.includes('href="./web/styles.css"') || html.includes('src="./web/app.js"')) throw new Error("External browser entry references survived inlining.");
if (/\b(?:src|href)=["']https?:\/\//i.test(html)) throw new Error("Release HTML contains a remote resource reference.");

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const commit = sourceCommit();
const builtAt = new Date().toISOString();
const playablePath = resolve(release, "Cascade-Play.html");
writeFileSync(playablePath, html);
const playableBytes = readFileSync(playablePath);

const readme = `CASCADE — OFFLINE PLAYABLE
==========================

Version: ${pkg.version}
Source commit: ${commit}

PLAY
----
1. Extract the ZIP before playing.
2. Open Cascade-Play.html in a current desktop Chrome, Microsoft Edge, or Firefox browser.
3. The game needs no network connection after extraction. All rules, scenarios, visuals and sound logic are embedded in the HTML file.
4. Sound begins only after a browser-approved user gesture. Use Sound: On / Muted at any time.
5. Keep Cascade-Play.html in one location if you want browser save/resume behavior to remain associated with the same file origin.

OBJECTIVE
---------
Regulate all four city services, keep lasting capacity at 4 or higher, clear committed damage, and hold stability for two rounds before the city collapses or the twelve-round deadline arrives.

FIRST TIME
----------
Choose Guided city-control training on the opening screen. It uses the same game rules as a normal crisis.

CONTENTS
--------
Cascade-Play.html       Self-contained playable game
BUILD-MANIFEST.json     Exact version/content/source identifiers and hashes
CREDITS.txt             Authorship and asset credits
AI-DISCLOSURE.txt       AI-assistance/runtime disclosure
VERIFICATION.txt        What was mechanically verified and what still requires human observation
source/                 Source snapshot and project documentation used for this build

This package is designed to be opened locally. No account, backend, live AI service or runtime network connection is required.
`;

const credits = `CASCADE — CREDITS
=================

Project identity / copyright: Purysho
Game design and implementation: Purysho with OpenAI ChatGPT/Codex assistance

Runtime graphics:
- City, service nodes, traffic, communications, emergency movement, AI disruption and consequence overlays are generated by original project code.
- No external art pack is required by the playable build.

Runtime audio:
- Short cues are synthesized locally with the Web Audio API by original project code.
- No external music or sound-effects pack is bundled.

Third-party runtime dependencies:
- None. The final playable HTML has no backend and no runtime package or network dependency.

Development tooling:
- TypeScript
- Node.js
- GitHub Actions / hosted browser drivers for automated verification

See AI-DISCLOSURE.txt for the explicit AI-tool statement.
`;

const aiDisclosure = `CASCADE — AI TOOL DISCLOSURE
============================

OpenAI ChatGPT/Codex was used during planning, design iteration, programming, test authoring, debugging and documentation.

Cascade does NOT call an AI model during gameplay. There is no live model, model API, account, telemetry backend or network requirement in the final playable file.

The game's city systems, AI directives, safety interventions, scores and failure cascades are authored simulation abstractions. They are not generated live by an AI model and are not claims about the probability of real-world failures.

The browser visuals and short sound cues are produced locally by project code. No external generated-art pack or generated-audio pack is required at runtime.
`;

const verificationText = `CASCADE — VERIFICATION SUMMARY
==============================

Automated engineering evidence covers:
- strict TypeScript compilation;
- 33 engine/regression/adversarial tests;
- 1,000 deterministic generated crises with engine-verified legal recovery certificates;
- 1,000 automated replay reconstruction sessions;
- forecast/commit equivalence and hostile replay rejection;
- browser campaign, tutorial, audio/feedback, save/reload and ending/replay flows;
- Stage 5 viewport, keyboard/focus, 200% zoom reachability, save-conflict, corrupted-save and storage-failure checks;
- Windows build verification and direct Edge/Firefox smoke when the release workflow reports those jobs green;
- extracted self-contained file:// launch in the release smoke gate.

Human enjoyment, first-time comprehension, actual match duration, subjective audio mix and replay desire can only be established by observed human sessions. Automation is not reported as a substitute.

The detailed evidence and limitations are included in source/docs/VERIFICATION.md.
`;

writeFileSync(resolve(release, "README-FIRST.txt"), readme);
writeFileSync(resolve(release, "CREDITS.txt"), credits);
writeFileSync(resolve(release, "AI-DISCLOSURE.txt"), aiDisclosure);
writeFileSync(resolve(release, "VERIFICATION.txt"), verificationText);

const sourceRoots = ["src", "web", "design", "tests", "tools", "docs"];
const sourceFiles = [];
for (const directory of sourceRoots) {
  const full = resolve(root, directory);
  if (existsSync(full)) sourceFiles.push(...walk(full));
}
for (const file of [
  "README.md", "HANDOFF.md", "package.json", "package-lock.json", "tsconfig.json", "tsconfig.web.json", ".gitignore",
  ".github/workflows/engine.yml",
]) {
  const full = resolve(root, file);
  if (existsSync(full)) sourceFiles.push(full);
}

const manifest = {
  product: "Cascade",
  version: pkg.version,
  sourceCommit: commit,
  builtAt,
  schemaVersion: RULES.schemaVersion,
  rulesVersion: RULES.rulesVersion,
  contentVersion: CONTENT_VERSION,
  generatorVersion: GENERATOR_VERSION,
  contentHash: CONTENT_HASH,
  playable: {
    file: "Cascade-Play.html",
    bytes: playableBytes.length,
    sha256: sha256(playableBytes),
  },
  runtime: {
    liveAI: false,
    backend: false,
    networkRequired: false,
    externalArtAssets: false,
    externalAudioAssets: false,
  },
};
writeFileSync(resolve(release, "BUILD-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");

const zipEntries = [];
for (const name of ["Cascade-Play.html", "README-FIRST.txt", "CREDITS.txt", "AI-DISCLOSURE.txt", "VERIFICATION.txt", "BUILD-MANIFEST.json"]) {
  zipEntries.push({ name, data: readFileSync(resolve(release, name)) });
}
for (const file of sourceFiles) {
  const rel = slash(relative(root, file));
  zipEntries.push({ name: "source/" + rel, data: readFileSync(file) });
}

const zip = createStoreZip(zipEntries);
const zipName = `Cascade-v${pkg.version}.zip`;
writeFileSync(resolve(release, zipName), zip);

const releaseSummary = {
  version: pkg.version,
  sourceCommit: commit,
  playableBytes: playableBytes.length,
  playableSha256: manifest.playable.sha256,
  embeddedJavaScriptModules: jsFiles.length,
  embeddedJsonModules: jsonFiles.length,
  zip: zipName,
  zipBytes: zip.length,
  zipEntries: zipEntries.length,
};
writeFileSync(resolve(release, "release-report.json"), JSON.stringify(releaseSummary, null, 2) + "\n");
console.log(JSON.stringify(releaseSummary, null, 2));

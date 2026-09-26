import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { extractStoreZip } from "./release-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const release = resolve(root, "release");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const zipPath = resolve(release, `Cascade-v${pkg.version}.zip`);
const extractDir = resolve(root, ".release-verify");

if (!existsSync(zipPath)) throw new Error("Release ZIP missing. Run npm run package first.");
rmSync(extractDir, { recursive: true, force: true });

const zip = readFileSync(zipPath);
const files = extractStoreZip(zip, extractDir);
const required = [
  "Cascade-Play.html",
  "README-FIRST.txt",
  "CREDITS.txt",
  "AI-DISCLOSURE.txt",
  "VERIFICATION.txt",
  "BUILD-MANIFEST.json",
  "source/README.md",
  "source/docs/VERIFICATION.md",
  "source/package.json",
  "source/web/app.ts",
  "source/src/index.ts",
];
for (const file of required) {
  if (!files.includes(file)) throw new Error("Release ZIP is missing " + file);
}

const htmlPath = resolve(extractDir, "Cascade-Play.html");
const html = readFileSync(htmlPath, "utf8");
if (!html.includes('<script type="importmap">')) throw new Error("Self-contained HTML is missing the embedded import map.");
if (!html.includes('import "cascade/web/app.js"')) throw new Error("Self-contained HTML is missing the embedded app entry.");
if (html.includes('href="./web/styles.css"') || html.includes('src="./web/app.js"')) throw new Error("Self-contained HTML still references external app files.");
if (/\b(?:src|href)=["']https?:\/\//i.test(html)) throw new Error("Self-contained HTML contains a remote resource reference.");
if (!html.includes("data:text/javascript;base64,")) throw new Error("Self-contained HTML did not embed JavaScript modules.");

const manifest = JSON.parse(readFileSync(resolve(extractDir, "BUILD-MANIFEST.json"), "utf8"));
const playable = readFileSync(htmlPath);
const hash = createHash("sha256").update(playable).digest("hex");
if (manifest.product !== "Cascade" || manifest.version !== pkg.version) throw new Error("Build manifest product/version mismatch.");
if (manifest.playable?.sha256 !== hash || manifest.playable?.bytes !== playable.length) throw new Error("Build manifest playable hash/size mismatch.");
if (manifest.runtime?.networkRequired !== false || manifest.runtime?.liveAI !== false || manifest.runtime?.backend !== false) {
  throw new Error("Build manifest runtime declarations are inconsistent with the offline release.");
}

const sourceManifestPkg = JSON.parse(readFileSync(resolve(extractDir, "source/package.json"), "utf8"));
if (sourceManifestPkg.version !== pkg.version) throw new Error("Bundled source package version does not match release version.");

console.log(JSON.stringify({
  releaseZip: zipPath,
  extractedFiles: files.length,
  version: pkg.version,
  sourceCommit: manifest.sourceCommit,
  playableBytes: playable.length,
  playableSha256: hash,
  selfContainedImportMap: true,
  remoteResourceReferences: 0,
  sourceSnapshot: true,
}, null, 2));

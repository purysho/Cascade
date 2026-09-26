# Cascade — Stage 6 release

## Build

Requires Node.js 24+.

```sh
npm ci --ignore-scripts
npm run release
```

The release command:

1. builds the static browser target;
2. creates a self-contained `release/Cascade-Play.html`;
3. creates the source-inclusive `release/Cascade-v0.6.0.zip`;
4. verifies the extracted ZIP, manifest, hashes and absence of remote resource references;
5. launches the extracted HTML directly through `file://` in Chrome;
6. verifies entry, action/undo/commit, local save/reload/resume and embedded tutorial loading.

## Package contents

The ZIP contains:

- `Cascade-Play.html` — self-contained playable game;
- `README-FIRST.txt` — player instructions;
- `BUILD-MANIFEST.json` — version, source commit, rules/content/generator IDs, content hash and playable SHA-256;
- `CREDITS.txt`;
- `AI-DISCLOSURE.txt`;
- `VERIFICATION.txt`;
- `source/` — the source and project documentation used to produce the build.

The playable file contains no runtime CDN, backend, live-model or external asset dependency.

## CI release gate

The repository workflow verifies:

- Linux strict types, 33 tests, 1,000 generated crises and 1,000 replay sessions;
- Stage 2–5 Chrome browser flows;
- extracted `file://` release launch;
- Windows engine/build/package verification;
- direct Windows Edge and Firefox browser smokes.

A green workflow uploads:

- `cascade-release` — final playable file, ZIP and release metadata;
- `browser-smoke` — rendered evidence screenshots;
- Windows Edge / Firefox screenshot artifacts.

## Human evidence boundary

Packaging does not make human playtest claims true. Use `docs/PLAYTEST_PROTOCOL.md` for the remaining observed-player evidence.

## Submission boundary

This release work does not deploy or submit Cascade to a competition. Registration, eligibility and submission remain separate actions requiring explicit user authorisation.

# Cascade handoff — Stage 6

Date: 26 September 2026. Repository: https://github.com/purysho/Cascade.

## Status

Stages 0–6 engineering implementation is complete at v0.6.0.

Cascade now includes:

- deterministic rules/resolution engine;
- seeded roguelike-lite crises with verified legal recovery certificates;
- live browser city and exact forecasts;
- guarded replay/save system;
- four session-only guided exercises;
- offline procedural audio and event-driven consequence feedback;
- stale-tab save-conflict protection;
- broader desktop/zoom/keyboard/error-state validation;
- direct Windows Edge and Firefox browser smoke coverage;
- self-contained `Cascade-Play.html`;
- source-inclusive release ZIP with manifest, credits, AI disclosure and verification notes;
- extracted-package `file://` browser smoke;
- human playtest protocol and 3–5-minute demo script.

The deterministic engine model and content hash remain unchanged from the Stage 1–4 rules baseline. Stage 5/6 work is browser persistence, validation, packaging and documentation.

## Stage 5 evidence

GitHub Actions run `36218522113` passed all four jobs on the Stage 5/6 branch:

### Linux / Chrome

- strict TypeScript;
- 33 engine/regression/adversarial tests;
- 1,000 deterministic generated crises with verified recovery certificates;
- 1,000 replay-checked automated sessions;
- original campaign/tutorial/Stage 4 Chrome smoke;
- complete rendered authored win using the verified recovery witness;
- same-crisis replay;
- real no-intervention collapse;
- keyboard-only How to Play open/close with focus return;
- 1366×768-class and 1920×1080-class layouts;
- 200% zoom with End Round remaining reachable;
- reduced-motion control;
- corrupted-save rejection;
- simulated browser-storage write failure while play continues in memory;
- stale/newer-tab save conflict blocks overwrite and warns the player;
- zero SEVERE browser-console errors.

### Windows

- `windows-engine`: full `npm run check`, package generation and ZIP extraction/hash verification — PASS.
- `windows-browser (edge)`: direct Microsoft Edge WebDriver smoke — PASS.
- `windows-browser (firefox)`: direct Firefox/GeckoDriver smoke — PASS.

Rendered Windows screenshots were inspected. Both browsers preserve the control-room hierarchy, live city, forecast, event trace and action console.

## Stage 6 release

`npm run release` performs:

1. static browser build;
2. self-contained HTML generation by embedding the compiled JS module graph and JSON content into an import map;
3. generation of player instructions, credits, AI disclosure and verification summary;
4. source-inclusive deterministic ZIP creation;
5. clean-directory ZIP extraction and CRC/hash verification;
6. direct Chrome launch of the extracted `Cascade-Play.html` over `file://`;
7. entry, action/undo/commit, save/reload/resume and tutorial checks.

The verified branch artifact reported:

- version: `0.6.0`;
- rules: `0.2.0`;
- content: `0.2.0`;
- generator: `seeded-crisis-1`;
- content hash: `bc4ecfbe7cdbffdf`;
- embedded JS modules: 16;
- embedded JSON modules: 4;
- self-contained HTML size: 204,271 bytes;
- ZIP entries: 67;
- ZIP size: 603,005 bytes.

The branch artifact SHA-256 for `Cascade-Play.html` was `b5c8b5c19026305bf2b63bd23ef205ffdfbe16e8ea7fb38fdf26742b42c6a4e4`. Rebuilds after later documentation/merge commits will legitimately produce a different hash and source-commit entry; always use the manifest shipped with the final artifact.

## Architecture boundaries to preserve

- `GameState` is authoritative.
- UI renders `projectForPlayer(state)`.
- Forecast and committed round resolution use the same deterministic resolver.
- Animation/audio/consequence feedback may only represent player-visible state/events.
- Tutorial remains session-only and cannot overwrite campaign saves.
- Sound/motion settings and save-conflict metadata remain outside replay/game state.
- Final packaging must not introduce a runtime network, CDN, backend, live-model, or external asset dependency.

## Human evidence boundary

No real human playtest was available inside the autonomous build environment.

Therefore the following remain explicitly **untested** rather than inferred:

- first-time tutorial comprehension;
- actual human match duration;
- enjoyment/fun;
- subjective sound mix;
- strategy choices by real players;
- willingness to replay.

Use `docs/PLAYTEST_PROTOCOL.md` to collect that evidence. Do not substitute solver success, browser automation or model opinion for human observation.

## What comes next

The software build itself does not require another numbered engineering stage.

Optional next work:

1. run the human playtest protocol and fix only observed issues;
2. record the demo using `docs/DEMO_SCRIPT.md`;
3. verify the user's competition registration/eligibility and current submission rules;
4. only with explicit authorisation, prepare/deploy/submit the entry.

Competition deployment/submission has not been authorised by this handoff.

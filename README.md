# Cascade

**Regain control before the city falls apart.**

Cascade is a solo crisis-strategy game about AI deployed across essential services without effective oversight. An optimisation platform improves its own metrics while harming the people those services exist to support. Stabilise the city, interrupt unsafe orders, and establish enforceable human control.

## Current status

**Stages 0–6 engineering work is complete. Cascade v0.6.0 is a tested, self-contained offline browser game.**

- Four connected services, twelve rounds, three action points per round.
- Seven operational actions, eight unsafe directives, and three authored practice crises.
- Seeded starting damage, resources, threat schedules, emergency-tool offers, and a seed-stable generated city presentation.
- A small roguelike layer: choose one of three consumable tools at the start and after rounds four and eight.
- A live Canvas city: buildings react to power availability, traffic changes with transit capacity, communications pulse through the network, emergency vehicles move through the city, and unchecked AI orders visibly radiate into affected services.
- Exact engine-backed consequence forecasts, dependency-failure links, delayed-damage markers, undo, permanent oversight, and all endings.
- Guarded browser save/resume using the replay validator, plus protection against a stale browser tab overwriting a newer save.
- Same-crisis replay and fresh-seed replay.
- Reduced-motion support, keyboard/focus checks, 200% zoom reachability, and an in-game rules reference.
- Four guided exercises: read an unsafe optimisation, break a dependency cascade, contain a live order with backup + isolation, and install permanent oversight.
- Optional procedural Web Audio cues for actions, containment, unchecked orders, cascade failures, delayed damage, and endings.
- Event-driven round-resolution banners and map shock rings derived from committed engine events.
- Direct automated browser evidence on Linux Chrome and Windows Microsoft Edge + Firefox.
- A self-contained `Cascade-Play.html` that launches directly from an extracted ZIP via `file://`, with no backend, live AI, CDN, or runtime network requirement.
- Release ZIP includes player instructions, build manifest, source snapshot, credits, AI-tool disclosure, verification summary, and demo materials.

The engine stress sample covers **1,000 reproducible seeds and 1,000 automated replay-checked sessions**. The browser suite also exercises a complete winning crisis, same-crisis replay, a real collapse, tutorial paths, save/reload, corrupted saves, storage failure, newer-tab conflicts, required desktop sizes, reduced motion, and the extracted offline package.

**Human enjoyment, first-time comprehension, actual play duration, subjective audio mix, and replay desire remain untested until a person is observed playing.** Use the included playtest protocol rather than treating automation as human evidence.

## Play the source build

Requires Node.js 24 or newer. No production dependencies or runtime network calls.

~~~sh
npm ci --ignore-scripts
npm run check
npm run web
~~~

Open `http://127.0.0.1:4173`.

## Build the final offline release

~~~sh
npm ci --ignore-scripts
npm run release
~~~

This produces:

- `release/Cascade-Play.html` — self-contained playable game;
- `release/Cascade-v0.6.0.zip` — playable, metadata, source and documentation;
- `release/BUILD-MANIFEST.json` — source commit, version, content/rules/generator IDs, content hash and playable SHA-256.

The release command extracts the ZIP and launches the resulting HTML directly through `file://` in Chrome to verify entry, action/undo/commit, save/reload/resume and tutorial loading.

Additional engineering checks:

~~~sh
npm run demo -- CASCADE
npm run demo -- overdrive --authored
npm run strategies
npm run browser:smoke
npm run stage5:smoke
~~~

## Read the project

| Document | Purpose |
| --- | --- |
| [Game rules](docs/GAME_RULES.md) | Resources, actions, tools, permissions, cascades, endings |
| [Seeded runs](docs/SEEDED_RUNS.md) | Random generation, drafts, recovery checks, replay limits |
| [Architecture](docs/ARCHITECTURE.md) | Engine and browser structure |
| [Experience and art](docs/EXPERIENCE_AND_ART.md) | Tutorial, instructions, graphics, accessibility |
| [Build and test plan](docs/BUILD_AND_TEST_PLAN.md) | Staged implementation and validation gates |
| [Verification](docs/VERIFICATION.md) | Actual results and explicit limitations |
| [Playtest protocol](docs/PLAYTEST_PROTOCOL.md) | Human-observation procedure and session form |
| [Release](docs/RELEASE.md) | Final package contents and build/verification flow |
| [Demo script](docs/DEMO_SCRIPT.md) | 3–5-minute real-gameplay demonstration outline |
| [Competition](docs/COMPETITION.md) | Previously checked requirements and unresolved entry details |
| [Handoff](HANDOFF.md) | Exact continuation point |

Runtime rules live in [rules-v0.2.json](design/rules-v0.2.json). The v0.1 rules and worked traces remain as historical regression fixtures.

## Delivery boundary

The game is packaged and technically release-ready. Competition registration, deployment, public submission, and claims about human fun/learning are separate steps and have not been performed.

Design and code assistance: OpenAI ChatGPT/Codex. The current city visuals and procedural sound cues are generated at runtime from original project code; no external art/audio pack or live model is required.

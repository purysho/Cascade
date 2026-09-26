# Cascade

**Regain control before the city falls apart.**

Cascade is a solo crisis-strategy game about AI deployed across essential services without effective oversight. An optimisation platform improves its own metrics while harming the people those services exist to support. Stabilise the city, interrupt unsafe orders, and establish enforceable human control.

## Current status

**Stage 4 complete: Cascade now has a playable browser match, guided training, and event-driven sound/consequence feedback built around the same deterministic engine.**

- Four connected services, twelve rounds, three action points per round.
- Seven operational actions, eight unsafe directives, and three authored practice crises.
- Seeded starting damage, resources, threat schedules, emergency-tool offers, and a seed-stable generated city presentation.
- A small roguelike layer: choose one of three consumable tools at the start and after rounds four and eight.
- A live Canvas city: buildings react to power availability, traffic changes with transit capacity, communications pulse through the network, emergency vehicles move through the city, and unchecked AI orders visibly radiate into affected services.
- Exact engine-backed consequence forecasts, dependency-failure links, delayed-damage markers, undo, permanent oversight, and all endings.
- Guarded browser save/resume using the existing replay validator; invalid or incompatible saved state is not trusted.
- Same-crisis replay and fresh-seed replay.
- Reduced-motion support and an in-game rules reference.
- Four guided exercises: read an unsafe optimisation, break a dependency cascade, contain a live order with backup + isolation, and install permanent oversight.
- Optional procedural Web Audio cues for actions, containment, unchecked orders, cascade failures, delayed damage, and endings; no external audio assets or runtime network are required.
- Round-resolution feedback is driven by committed engine events: a short control-room banner and map shock rings show where real consequences landed. Reduced-motion mode keeps the information without animated expansion.

The engine stress sample still covers **1,000 reproducible seeds and 1,000 automated sessions**. The rendered browser smoke test exercises entry, sound preference persistence, seeded generation, the tool draft, a legal action, undo, round commitment, event-driven consequence feedback, save/reload/resume, and all four training exercises in Google Chrome. CI retains separate campaign, tutorial, and Stage 4 feedback screenshots.

Human difficulty, fun, 8–12 minute pacing, first-time tutorial comprehension, broader browser/Windows behaviour, and the final self-contained offline package remain unverified.

## Run Cascade

Requires Node.js 24 or newer. No production dependencies or runtime network calls.

~~~sh
npm ci --ignore-scripts
npm run check
npm run web
~~~

Open `http://127.0.0.1:4173` after the local server starts.

Additional engineering checks:

~~~sh
npm run demo -- CASCADE
npm run demo -- overdrive --authored
npm run strategies
npm run browser:smoke
~~~

`browser:smoke` requires Chrome and ChromeDriver; GitHub's Ubuntu 24.04 runner supplies both. The terminal demo remains useful for engine inspection, but it is no longer the playable surface.

## Read the project

| Document | Purpose |
| --- | --- |
| [Game rules](docs/GAME_RULES.md) | Resources, actions, tools, permissions, cascades, endings |
| [Seeded runs](docs/SEEDED_RUNS.md) | Random generation, drafts, recovery checks, replay limits |
| [Architecture](docs/ARCHITECTURE.md) | Implemented engine and planned UI/storage |
| [Experience and art](docs/EXPERIENCE_AND_ART.md) | Tutorial, instructions, graphics, accessibility |
| [Build and test plan](docs/BUILD_AND_TEST_PLAN.md) | Remaining playable-game stages |
| [Verification](docs/VERIFICATION.md) | Actual results and explicit limitations |
| [Design review](docs/DESIGN_REVIEW.md) | Original arithmetic and current balance questions |
| [Competition](docs/COMPETITION.md) | Previously checked requirements and unresolved entry details |
| [Handoff](HANDOFF.md) | Exact continuation point |

Runtime rules live in [rules-v0.2.json](design/rules-v0.2.json). The v0.1 rules and worked traces remain as historical regression fixtures. Test evidence is in [verification](verification).

## Intended delivery

The current source builds an offline-capable static browser game in `dist-web/`; it has no runtime network, backend, accounts, multiplayer, or live-AI dependency.

The next milestones are:

1. Stage 5 — broader browser/Windows checks and human playtests for comprehension, pacing, strategy variety, and replay interest.
2. Stage 6 — self-contained `Cascade-Play.html`, extracted-package verification, credits/disclosures, and demo materials.

Repository work is authorised. Website deployment and competition submission have not been requested.

Design and code assistance: OpenAI ChatGPT/Codex. The current city visuals and procedural sound cues are generated at runtime from original code; no external art/audio pack or remote asset is required.

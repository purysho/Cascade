# Cascade handoff — Stage 2

Date: 26 September 2026. Repository: https://github.com/purysho/Cascade.

## User direction

Build Cascade for Mangrove Game Night as a game first: a tense, replayable city-crisis strategy game where unchecked AI is continuously visible disrupting essential services. The player should feel the city operating and degrading rather than reading about a past failure. The user specifically requested a more city-simulation-like sense of motion and systemic activity, while preserving seeded replayability and the small roguelike tool layer.

## Completed through Stage 2

### Deterministic game engine

- Strict TypeScript engine: seven actions, eight directives, delayed consequences, one-wave dependencies, all endings, causal events, exact forecasts, undo, and stale-command rejection.
- Three authored crises and executable recovery routes for all three.
- Seeded initial conditions and twelve-round schedules, checked against real-engine winning routes before acceptance; bounded fallback.
- Six one-shot emergency tools; drafts at rounds 1, 5, and 9; one tool use per round.
- Public projection excludes unrevealed orders and future tool offers.
- Bounded replay export/import reconstructs state from legal commands and installed content.
- Locked development dependencies, Node built-in tests, stress/strategy tools, and GitHub Actions.

### Playable browser game

- Start screen with generated-seed crises, optional shareable seed entry, and three fixed practice cases.
- Seed-stable generated city presentation.
- Live Canvas city driven only by current public engine state:
  - building lights/flicker follow grid availability;
  - traffic speed follows transit availability;
  - communications packets move through the service network;
  - emergency vehicles move while emergency capacity exists;
  - autonomous services display AI-control scanning;
  - current unchecked AI directives radiate continuously from their service and send visible pulses toward harmed targets;
  - blocked directives visibly change state;
  - forecasted dependency failures pulse across the actual dependency links;
  - committed delayed damage appears on the affected service.
- Service console with integrity, effective capacity, lasting capacity, control mode, AP/supply costs, legal actions, and exact disabled reasons.
- Current AI-order panel, exact same-resolver forecast, causal event trace, undo, and end-round flow.
- Tool-draft modal and held emergency assets.
- Win/collapse/deadline result screen, same-crisis replay, and fresh generated replay.
- Guarded localStorage save/resume using the replay validator; storage failure leaves the in-memory session playable.
- Reduced-motion setting and system preference support.
- Concise in-game How to Play reference.

## Verification at this handoff

`npm run check` passes on the PR branch and includes:

- strict type checking;
- 33 engine/regression/adversarial tests;
- 1,000 deterministic generated crises with verified winning certificates;
- 1,000 automated sessions with replay reconstruction checks;
- browser-target compilation.

The GitHub Actions browser smoke test also passes in Google Chrome via ChromeDriver. It exercises:

entry → fixed seed → tool draft → legal action → undo → commit → save → reload → resume.

Latest measured viewport: 1440×757, DPR 1. The run resumed at round 2/12, had zero SEVERE browser-console entries, and uploaded a rendered screenshot artifact.

The screenshot was inspected. The initial build allowed upper service nodes to sit beneath HUD overlays; their positions were adjusted so the live map remains legible around the service rail and open forecast panel.

## Architecture rule to preserve

The browser controller owns the authoritative GameState, but UI components render `projectForPlayer(state)`. The animation layer is representational only. It must not invent hidden future information, random gameplay effects, or alternate consequences. Round forecasts and committed outcomes continue to share the same deterministic resolver.

## Run locally

~~~sh
npm ci --ignore-scripts
npm run check
npm run web
~~~

Then open http://127.0.0.1:4173.

On a machine with Chrome + ChromeDriver:

~~~sh
npm run browser:smoke
~~~

## Next scoped task — Stage 3

Implement the guided tutorial from `docs/EXPERIENCE_AND_ART.md` as four short normal-engine practice checkpoints:

1. Read the danger.
2. Break the cascade.
3. Contain safely.
4. Restore control.

Tutorial progress should be based on state predicates, not hard-coded screen coordinates. Do not secretly alter costs, damage, or permissions. Each exercise needs a verified reset state, an explicit task, escalating requested hints, completion feedback, skip/reset controls, and a clear transition into a generated crisis.

After the tutorial works, proceed to audio/final polish, broader browser/Windows verification, human playtesting, and finally the self-contained offline export/package.

## Remaining limitations

- No human playtest yet; fun, strategy depth, replay desire, and 8–12 minute pacing remain unverified.
- No guided tutorial implementation yet.
- No audio yet.
- Chrome desktop is the only rendered browser flow currently automated.
- The browser build is static and offline-capable after build, but the final self-contained single-file `Cascade-Play.html` and extracted ZIP verification are not built yet.
- Competition submission/deployment has not been authorised.

Repository pushes are authorised. Preserve later edits on `main` when continuing.

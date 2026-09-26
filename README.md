# Cascade

**Regain control before the city falls apart.**

Cascade is a solo crisis-strategy game about AI deployed across essential services without effective oversight. An optimisation platform improves its own metrics while harming the people those services exist to support. Stabilise the city, interrupt unsafe orders, and establish enforceable human control.

## Current status

**Stage 1 complete: deterministic TypeScript rules engine and seeded crisis generation. A playable visual game is the next milestone.**

- Four connected services, twelve rounds, three action points per round.
- Seven operational actions, eight unsafe directives, and three authored crises.
- Seeded starting damage, resources, threat schedules, and emergency-tool offers.
- A small roguelike layer: choose one of three consumable tools at the start and after rounds four and eight. Six tools, at most one use per round; no permanent power grind.
- Exact forecasts, reversible planning, permanent oversight, delayed damage, bounded cascades, all endings, and validated replay import/export.
- Every generated setup is accepted only after an actual legal winning route is replayed through the engine. A bounded, verified fallback handles unsuccessful attempts.

The original design traces and all authored crises are verified. The stress sample covered **1,000 reproducible seeds and 1,000 automated sessions**. These checks establish rule consistency and sampled state integrity; human difficulty and fun remain untested.

## Run the engine

Requires Node.js 24 or newer. No production dependencies or runtime network calls.

~~~sh
npm ci --ignore-scripts
npm run check
npm run demo -- CASCADE
npm run demo -- overdrive --authored
npm run strategies
~~~

The demo prints an automated recovery route. It is an engineering demonstration, not a playable interface. The comparison command records strategies restricted to current player-visible information.

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

A downloadable offline browser game with a guided tutorial, persistent help, an illustrated city, clear consequences and endings, same-seed replay, and new seeded crises. Target duration is 8–12 minutes, still unmeasured.

Next: implement one complete visual match using this engine, then guarded browser saves and a self-contained offline export. Tutorial, finished graphics, audio, browser testing, Windows smoke test, and playable package remain outstanding.

No live AI calls, accounts, network multiplayer, procedural city maps, backend, or large progression system are planned. Repository work is authorised; website deployment and competition submission have not been requested.

Design and code assistance: OpenAI ChatGPT/Codex. No generated artwork, human playtest, competition entry, or playable release is claimed at this milestone.

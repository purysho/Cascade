# Cascade

**Regain control before the city falls apart.**

Cascade is a solo crisis-strategy game about the danger of AI deployed across essential services without effective oversight. An optimisation platform keeps improving its own metrics while harming the people those services exist to support. The player must stabilise the city and establish enforceable human control.

## Current status

**Stage 0: rules and architecture. No playable game exists yet.**

The baseline specifies four interconnected services, twelve rounds, seven actions, eight unsafe directives, and three authored crises. One recovery route and two collapse examples have received numerical design checks. Balance, graphics, browser behaviour, and human playability remain untested.

## Read the design

| Document | Purpose |
| --- | --- |
| [Game rules](docs/GAME_RULES.md) | Exact resources, actions, permissions, cascade order, and endings |
| [Architecture](docs/ARCHITECTURE.md) | Engine boundaries, state contracts, replay, saves, and offline delivery |
| [Experience and art](docs/EXPERIENCE_AND_ART.md) | Tutorial, instructions, interface, original graphics, audio, accessibility |
| [Build and test plan](docs/BUILD_AND_TEST_PLAN.md) | Sequenced implementation and risk-based verification gates |
| [Design review](docs/DESIGN_REVIEW.md) | Worked recovery, collapse arithmetic, and unresolved design risks |
| [Competition](docs/COMPETITION.md) | Verified event requirements, sources, and readiness gaps |
| [Handoff](HANDOFF.md) | Current stopping point and the next implementation task |

The versioned [rules data](design/rules-v0.1.json) and [scenario data](design/scenarios-v0.1.json) are the numerical design baseline.

## Intended delivery

A downloadable offline browser game and complete source, with a guided tutorial, persistent help, original city visuals, replay, and a cause-by-cause ending explanation. Target match length is 8–12 minutes and must be measured during human playtesting.

The runtime will use a deterministic simulation. Live AI calls, accounts, network multiplayer, backend services, and procedural cities are outside version 1.

Repository work is authorised here. Website deployment and competition submission have not been requested.

## Next milestone

Implement the headless rules engine, port the worked examples to executable fixtures, and establish winning traces for all three crises before building the rendered game.

## Credits and status of claims

Design assistance: OpenAI ChatGPT/Codex. No generated game artwork, playable build, browser test result, or human fun result is claimed at this stage.

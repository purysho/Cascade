# Cascade handoff — Stage 0

Date: 25 September 2026. Repository: https://github.com/purysho/Cascade.

## User direction

Build Cascade for Mangrove Game Night. AI safety must appear as the danger created by unregulated AI, with the player's goal stopping the crisis from spiralling and establishing control. The user requested rules and architecture before implementation of the game, including tutorial, instructions, graphics, and stress/bug testing.

The attached reusable brief supplied expectations for complete gameplay, coherent simulation, offline delivery, real-browser verification, and honest reporting. This repository's design documents instantiate that brief.

## Completed in this phase

- Empty repository inspected and initialised.
- Four-service, twelve-round rule system specified.
- Seven actions, eight directives, six dependency edges, three authored crises.
- Exact permission checks, delayed effects, one-wave cascade, resource costs, and ending priority.
- Deterministic engine architecture, save/replay contracts, and offline export plan.
- Tutorial, instructions, art, accessibility, and staged verification requirements.
- Numerical design checks for one Overdrive recovery route and two collapse examples.
- Versioned design data and expected traces saved alongside the documents.

No production engine, rendered game, generated artwork, tutorial implementation, dependency installation, playable release, browser check, or human playtest exists yet.

## Read next

1. [Rules](docs/GAME_RULES.md).
2. [Architecture](docs/ARCHITECTURE.md).
3. [Design review](docs/DESIGN_REVIEW.md).
4. [Build and test plan](docs/BUILD_AND_TEST_PLAN.md).
5. [Experience and art](docs/EXPERIENCE_AND_ART.md).

## Next scoped task

Implement Stage 1: pure rules engine and content validation, then reproduce the worked traces and verify solutions for Silent Dispatch and Cut Off. Check the current repository head and preserve later changes before editing.

Do not treat the temporary design calculator as the production engine. All seven actions, boundaries, save/replay behaviour, and actual browser operation still need their own implementation and checks.

Most important design risks: Emergency-first becoming universal; isolation/support having no useful role; unclear recovery pacing; untested human comprehension and fun. Keep the game finite and the UI consequences derived from the same state.

## Delivery and event notes

The named repository is authorised for this work. The present phase is documentation and design data only. No website deployment or competition submission was requested.

The event public page permits AI tools with disclosure, and requests playable materials plus a 3–5-minute video. Its listed submission deadline is 27 September 2026 at 15:00 Asia/Shanghai. Registration and additional participant/pre-kickoff rules remain unresolved; see [competition notes](docs/COMPETITION.md).

Do not claim registration, eligibility, submission, release readiness, performance, or human testing without evidence. Update this handoff and the verification record at each real implementation checkpoint.

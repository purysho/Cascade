# Cascade — Human playtest results

This file is the canonical human-evidence log for Cascade.

**Current status: no observed human sessions have been recorded yet.**

Automated engine, replay, browser, packaging, and accessibility checks are documented elsewhere. They are not substitutes for the observations required by [PLAYTEST_PROTOCOL.md](PLAYTEST_PROTOCOL.md).

## Acceptance target for the first pass

The first human pass is complete only after observing:

1. one first-time player complete the four guided training exercises; and
2. one full generated crisis played cold by a first-time or near-first-time player.

The same player may complete both in one sitting.

## Session record template

Copy this section once per participant.

### Session PT-___

| Field | Result |
| --- | --- |
| Date | |
| Tester code | |
| Browser / OS | |
| Observer | |
| Training duration | |
| Training hints used | |
| Training confusion points | |
| Noticed live AI order before commit? | |
| Explained downstream Grid cascade? | |
| Explained backup + isolation tradeoff? | |
| Explained isolation vs permanent oversight? | |
| Unprompted answer: main danger | |
| Unprompted answer: why immediate shutdown can hurt | |
| Full-crisis seed | |
| Full-crisis duration | |
| Ending / round | |
| First regulated service | |
| Tools drafted / used | |
| How-to opens | |
| Undo count | |
| Forecast confusion points | |
| Surprising cascade(s) | |
| Explained decisive causal chain? | |
| Wants another run? | |
| Reason | |
| Most important quote / observation | |

## Finding log

Add findings only from observed sessions.

| ID | Evidence | Severity | Proposed action | Status |
| --- | --- | --- | --- | --- |
| — | No human findings recorded yet | — | Run first cold playtest | Open |

## Decision rules

Prioritise a product fix when a first-time player:

- cannot state the objective after training;
- repeatedly confuses forecast with committed outcome;
- cannot understand backup versus isolation;
- experiences a cascade as arbitrary because dependency cues were missed;
- cannot explain why the run ended;
- cannot reach important controls at ordinary desktop size or zoom.

Do not treat losing as a defect by itself. Fix comprehension before balance unless repeated human evidence shows a dominant strategy or tool.

## Evidence boundary

Until at least one real session is logged above, the following remain **untested with humans**:

- first-time comprehension;
- enjoyment;
- subjective audio quality;
- real match duration;
- replay desire.

Do not infer those from automated sessions.

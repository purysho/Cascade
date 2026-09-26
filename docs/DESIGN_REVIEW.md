# Cascade — design review and current evidence

## Stage 1 update

The review below records the original Stage 0 evidence. It is preserved as design history. The v0.2 engine now reproduces its three traces, verifies solutions for every authored crisis, and implements seeded runs with six draftable tools. Current checks and unresolved limits are in [VERIFICATION.md](VERIFICATION.md).

The public-information comparison did not find Emergency-first dominating the sample: four fixed-first approaches and an adaptive approach all won 27 cases, with different completion speeds. Repair-only survived to the deadline without achieving oversight. A backed isolation fixture averts a concrete collapse. These are mechanical results, not proof of balanced or enjoyable play.

The key current uncertainty is whether a small city with several viable regulation orders produces interesting human decisions, and whether consumable drafts improve them. Complete the playable loop and observe first-time players before adding more systems.

Reviewed 25 September 2026. Baseline rules/content version 0.1.0.

## What was actually checked

The repository was inspected and found empty, with write access available. A short project README established the design phase.

The exact rules were translated into a temporary arithmetic calculator for three Overdrive traces. That calculator checks action budgets, supplies, relevant action preconditions, phase order, delayed effects, one-wave dependencies, strain, and endings for those specific action sequences. It is not the production engine and does not implement or test every action.

The resulting expectations are preserved in [worked-traces-v0.1.json](../design/worked-traces-v0.1.json). The future engine must reproduce them independently.

## Recovery witness

Integrity vectors below use Grid / Transit / Communications / Emergency order. Actions are listed in their actual execution order. AP costs never exceed three per round.

| Round | Actions | End integrity | Supplies | Strain | Stable streak |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | Prepare Grid backup; enforce Grid oversight | 3 / 4 / 4 / 5 | 6 | 1 | 0 |
| 2 | Repair Grid; prepare Communications backup; resupply | 5 / 2 / 5 / 4 | 6 | 3 | 0 |
| 3 | Repair Transit; enforce Communications oversight | 5 / 4 / 5 / 5 | 3 | 4 | 0 |
| 4 | Resupply; prepare Emergency backup; repair Transit | 5 / 6 / 5 / 3 | 3 | 5 | 0 |
| 5 | Resupply; enforce Emergency oversight | 5 / 6 / 5 / 3 | 4 | 6 | 0 |
| 6 | Repair Emergency; resupply; prepare Transit backup | 5 / 6 / 5 / 5 | 4 | 4 | 0 |
| 7 | Enforce Transit oversight; resupply | 5 / 3 / 5 / 5 | 5 | 5 | 0 |
| 8 | Repair Transit | 5 / 5 / 5 / 5 | 4 | 3 | 1 |
| 9 | Commit without spending AP | 5 / 5 / 5 / 5 | 4 | 1 | 2 — win |

This demonstrates at least one consistent route through the proposed Overdrive arithmetic. The witness was authored with access to the full scenario schedule; it is not evidence for a policy restricted to player-visible information. It does not establish balance, optimality, player discoverability, or the viability of other crises.

### A turn that exposes the key consequence

At the end of round 6, all services are healthy, but the AI has already deferred Transit maintenance. Transit oversight is installed during round 7. The current unsafe orders are blocked, yet the already committed −3 Transit consequence still applies. Transit falls to 3, strain rises, and durable recovery has not started.

Round 8's repair brings Transit to 5 and produces the first stable check. Round 9 confirms recovery. Oversight prevents new harm; it does not magically reverse existing damage.

## Contrasting failures

**No intervention:** Overdrive's narrow optimisation points rise from 0 to 15, but strain reaches 18 by round 3 and the run loses. The improvement in the AI metric accompanies deterioration in public conditions.

At round 2, due damage puts Grid at 2. Centralised routing puts Transit at 2 and Communications at 5. The pre-cascade snapshot is 2 / 2 / 5 / 5. Grid sends one damage to Transit, Communications, and Emergency; Transit sends one to Emergency. The simultaneous result is 2 / 1 / 4 / 3. Deficit is 2 + 3 + 0 + 1 = 6.

**Unprepared shutdown:** isolate Grid, Transit, and Communications in round 1, then Emergency in round 2. All AI orders are blocked, but lost service capacity and physical dependencies produce strain 25 and two zero-availability services by round 2. It loses. This demonstrates why a shutdown needs working alternatives; it does not imply every isolation decision is bad.

## Design decisions resolved

- A fixed single-wave cascade avoids graph-order bugs and unexplained infinite chains.
- Public orders and exact previews make dangerous effects attributable.
- Manual capacity caps make isolation useful but costly.
- Permanent oversight and two stable rounds make the goal actual recovery, rather than surviving a timer.
- Physical maintenance damage persists after permissions are removed.
- Three authored scenarios keep the first build finite and reproducible.

## Remaining uncertainties, ranked

1. **Dominant opening:** Emergency oversight blocks many orders. Compare it with Grid-first, Communications-first, and temporary isolation strategies across every crisis.
2. **Real value of isolation/support:** the worked winning trace uses neither. Create situations where they are useful choices, not tutorial-only decoration. Do not force their use with arbitrary achievements.
3. **Recovery pacing:** the final stable check could feel like an empty click. Use a short visible recovery recap and measure whether this is satisfying; change the requirement only with a rules-version update.
4. **Difficulty and recoverability:** no evidence yet that new players can recover from one poor early choice or understand all seven actions.
5. **Scenario viability:** Silent Dispatch and Cut Off have authored data but no checked winning trace yet.
6. **Theme comprehension:** a player might interpret the game as ordinary maintenance. Observe whether they connect the repeated damage to unchecked automated authority and narrow objectives.
7. **Duration, fun, and replay:** no human sessions have occurred.

## Verification record

| Area | Status | Actual evidence and limit |
| --- | --- | --- |
| Repository baseline | PASS | Empty repository and push permission inspected; initial README created |
| Selected rule arithmetic | PASS | Three Overdrive traces calculated; expectations saved |
| Complete game and endings | NOT TESTED | Only design arithmetic exists; no production engine or playable UI |
| All actions and rule boundaries | NOT TESTED | Support, restore automation, deadline priority, and many edge cases remain |
| Generation/replay/saves | NOT TESTED | Three fixed schedules specified; no runtime or storage implementation |
| Strategy balance | NOT TESTED | One winning witness and two failure traces do not establish balance |
| Browser/layout/native controls | NOT TESTED | No rendered build |
| Graphics/audio/tutorial | NOT TESTED | Experience and asset requirements specified only |
| Human fun/replay/learning | NOT TESTED | No people observed |
| Final playable package | NOT TESTED | No playable artifact or export exists |
| Deployment/submission | N/A | Not requested |
| Competition readiness | NOT TESTED | Public requirements read; participant rules, registration status, and an actual entry remain unresolved |

Use PASS / FAIL / BLOCKED / NOT TESTED / N/A for the eventual release record. No unperformed build check is counted as passed.

Most important design risk is a universal opening that turns the game into a procedure. The next improvement must be supported by real engine strategy traces and then human play.

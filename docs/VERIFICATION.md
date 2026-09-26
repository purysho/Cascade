# Cascade v0.2 — engine verification

Date: 25 September 2026. Scope: Stage 1, headless rules engine and seeded runs. No playable visual build exists yet.

Environment: Linux container, Node v24.19.0, TypeScript 5.9.3. Development dependencies are locked. Content fingerprint: bc4ecfbe7cdbffdf.

## Commands and evidence

- npm run typecheck — strict types, unchecked indexes, unused code checks.
- npm test — 33 cases covering original arithmetic, every authored solution, actions/permissions, ending priority, generation/fallback, drafts/tools, public information boundaries, undo, replay, and hostile imports.
- npm run stress — 1,000 seeds and 1,000 generated/authored automated sessions.
- npm run strategies — eight policies across three authored and 24 seeded crises.
- npm run demo -- CASCADE — executable textual demonstration of a certified recovery.

Exact machine-readable results: [engine-report.json](../verification/engine-report.json), [strategy-report.json](../verification/strategy-report.json). The latter includes full action histories, not just aggregate wins. Re-running tools replaces reports with the new measurements.

## Results

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Strict compilation | PASS | TypeScript checks source, tests, and tools |
| Original arithmetic | PASS | Nine-round recovery, round-three nonintervention loss, round-two unprepared shutdown reproduced exactly |
| Authored scenario solutions | PASS | Seven-round legal winning routes for all three crises; privileged search, not human difficulty evidence |
| Rule boundaries and endings | PASS | Costs, caps, thresholds, permissions, delayed damage, simultaneous dependencies, support, stable streak, loss priority, deadline and round-12 win |
| Seeds and solvability | PASS | STRESS-0 through STRESS-999 reproduced; all 1,000 recovery certificates won |
| Consumable tools and drafts | PASS | Effects, consumption, per-round cap, undo, draft timing, rejection, ending priority, expiring vetoes |
| Forecast and information | PASS | Forecast equals committed resolution; inputs unchanged; future order/offer changes cannot affect current public projection |
| Replay validation | PASS | 1,000 session roundtrips, plus open plans, drafts, tool use and undo; malformed/oversized/deep/incompatible/forged/illegal records rejected |
| Stress invariants | PASS | 13,474 accepted commands, 26,948 rejected commands, 4,039 commitments; no failed assertions |
| Strategy comparison | PASS | Bounded experiment completed using current information only; does not establish balance |
| Browser persistence | NOT TESTED | Replay adapter exists; browser storage and conflict handling are not built |
| Entry, UI, tutorial, graphics, audio | NOT TESTED | Not built |
| Browser, keyboard, layout, offline ZIP, Windows | NOT TESTED | No rendered or packaged game |
| Human fun, duration, learning, replay interest | NOT TESTED | No observed human sessions |
| Competition readiness | NOT TESTED | No playable entry or video; registration/participant rules unresolved |
| Deployment/submission | N/A | Not requested |

GitHub Actions is configured to run npm run check on main pushes and pull requests. Its remote run status must be checked for the delivered commit; this document does not substitute a local result for a remote check.

## Generation sample

The 1,000 seeds produced 572 distinct initial states and 72 opening order sequences. Candidate acceptance averaged 3.324 attempts. One seed, STRESS-336, used the checked fallback after 24 attempts; it is preserved as a targeted regression case.

All certificates decline tools and use no consumables. Templates are conservative acceptance filters with privileged knowledge. Unchecked candidates are discarded; rejection does not prove impossibility. No guarantee covers arbitrary later mistakes.

Random-action sessions ended in 999 collapses and one unresolved deadline. This is an invariant/adversarial exercise, not a difficulty measurement.

## Current-information strategy comparison

Each policy ran the same 27 crises. Fixed-first policies prioritise one service until their first regulation, then share the adaptive one-round heuristic. They may inspect every legal current plan; they cannot inspect future orders or recovery certificates. All decline tools to isolate the base mechanics.

| Policy | Wins / 27 | Other outcomes | Mean winning round |
| --- | ---: | --- | ---: |
| No intervention | 0 | 27 collapses | — |
| Repair-only | 0 | 27 deadlines | — |
| Indiscriminate isolation | 0 | 27 collapses | — |
| Emergency-first | 27 | — | 6.93 |
| Grid-first | 27 | — | 6.74 |
| Communications-first | 27 | — | 7.04 |
| Transit-first | 27 | — | 6.85 |
| Adaptive | 27 | — | 6.85 |

Emergency-first did not dominate this sample. Several recovery orders work, and repairs alone cannot satisfy the victory condition. A specific backed-isolation fixture prevents an otherwise immediate collapse, so isolation has a genuine mechanical use.

However, strong one-round search succeeding with every opening leaves difficulty, repetition, and tool balance unresolved. It does not show that beginners will find those plans or enjoy doing so. Build the interface and tutorial, then observe decisions before adding further mechanics.

## Timing and limits

The recorded run's 95th-percentile forecast time was below 0.1 ms and seeded generation below 15 ms in this container. Raw observations are in engine-report.json. These are neither browser measurements nor Windows performance promises.

No runtime rule regression remained after the checks. The principal implementation risks addressed were simultaneous dependency resolution, irreversible committed damage, stale repeated input, replay forgery, and forecast information leakage. Their targeted fixtures remain in the repository.

Next evidence needed: a real-browser complete match, reload and offline export, followed by first-time player observations of comprehension, pacing, meaningful tool choices, and willingness to replay.

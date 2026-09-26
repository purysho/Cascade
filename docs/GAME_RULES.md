# Cascade — game rules v0.2.0

Status: implemented and checked in the headless engine; human balance and the playable interface remain untested.
The numerical source is [rules-v0.2.json](../design/rules-v0.2.json).
The three authored crises are in [scenarios-v0.1.json](../design/scenarios-v0.1.json).
The original v0.1 rules and traces remain regression fixtures. The v0.2 extension adds seeded runs and consumable tools without changing the base action arithmetic.

## Premise and player goal

A city has handed essential services to a shared optimisation platform without independent approval, enforceable service guarantees, or tested fallbacks. Its efficiency targets reward cutting expensive coverage and postponing maintenance. Harm spreads through physical dependencies.

You are the emergency coordinator. Keep services operating, interrupt unsafe decisions, and put every service under enforceable human oversight. The intended feeling is tense, resourceful, then relieved as a chain of failures is broken.

This is a fictional, deliberately compressed crisis. The machine does not need consciousness, hatred, or secret omnipotence. Its orders follow narrow incentives and the permissions people gave it.

## Match scope

- Solo, desktop keyboard and mouse, offline browser build.
- One city with four service nodes: Grid, Transit, Communications, Emergency.
- At most 12 rounds; no real-time countdown. Target duration 8–12 minutes, unmeasured.
- Three operational action points per round. Inspecting, opening help, and previewing are free.
- Seeded crises plus three fixed authored cases; replay the same seed or choose a new one.
- Seeded runs draft one of three emergency tools at rounds 1, 5, and 9. Six tool types; at most one use per round.
- Complete game means entry, tutorial, decisions, animated consequences, endings, explanation, and replay.

## State and terminology

| Field | Definition |
| --- | --- |
| Integrity | An integer from 0 to 6: condition and retained operational capacity. Repairs change this. |
| Availability | Effective capacity for this round, derived from integrity, control mode, and temporary support. Never store a competing authoritative copy. |
| Control mode | Autonomous, isolated, or regulated. All four start autonomous. |
| Backup | Whether an independent manual fallback has been prepared. Starts false. |
| Supplies | City stock, 0–20. Starts at the scenario's value; there is no automatic income. |
| City strain | Accumulated unmet need and operational damage, not a casualty count. Cannot go below zero; 16 or more ends the run. |
| Optimisation points | The AI's own narrow performance measure. Executed orders increase it; it is not the player's score or a win condition. Starts at zero. |
| Pending consequences | Publicly visible damage already committed by an earlier order, with a due round. |
| Stable streak | Number of consecutive end-of-round checks satisfying every victory requirement. Starts zero. |

Availability calculation, in this order:

1. Integrity zero always gives availability zero.
2. Autonomous and regulated services have base availability equal to integrity.
3. An isolated service has base availability equal to the smaller of integrity and its manual cap: 1 without a backup; 3 with a backup.
4. Emergency support adds 1 availability for this round, up to 6, only to a service whose integrity is above zero.
5. A service below availability 3 can transmit a dependency failure. Capacity 3 prevents that transmission but remains below the stable demand level of 4.

A backup is intentionally limited. Isolation stops new AI orders involving that service, but prolonged reduced capacity causes unmet need. Durable oversight restores normal capacity while enforcing boundaries.

## Legal actions

Costs are paid immediately when an action is accepted. Invalid actions change nothing, including the action log and revision.

| Action | AP | Supplies | Exact result and preconditions |
| --- | ---: | ---: | --- |
| Repair | 1 | 1 | Add 2 integrity, capped at 6. Requires integrity below 6. A repair from 5 still costs the full amount. |
| Prepare backup | 1 | 2 | Set backup true. Requires no existing backup. Does not itself change mode or repair damage. |
| Isolate | 1 | 0 | Autonomous → isolated. Stop relevant new AI orders; apply the appropriate manual capacity cap. |
| Restore automation | 1 | 0 | Isolated → autonomous. Restore capacity and expose the service to AI orders again. |
| Enforce oversight | 2 | 2 | Autonomous or isolated → regulated. Requires backup true and integrity at least 3. Permanent for this match. |
| Emergency support | 1 | 1 | Add the temporary availability bonus. Requires integrity above zero, current availability below 6, and no support already assigned to that service this round. |
| Resupply | 1 | 0 | Once per round, add 3 supplies if current Transit availability is at least 4 and Communications at least 3; otherwise add 1. Cap at 20; disabled at 20. |

All actions also require enough AP and supplies, an active planning phase, and a valid target when needed. There is no trading AP between rounds. No action can undo regulation. Repeating isolation or backup preparation is illegal, not a resource sink.

Resupply uses the current planning state, including any support already assigned. Crossing its thresholds with temporary support is an intentional option with real AP and supply costs.

The player may undo the last uncommitted action for free. Undo rebuilds the open round from its starting snapshot and remaining action list. New-round information is not revealed by undo. Committing the round makes its actions final.

## Autonomous orders

Only the current round's orders and previously committed delayed consequences are revealed. Their affected services, benefits, damage, and permission requirements are explicit. Future rounds and later tool offers remain hidden during normal play.

An order executes only when every service in its permission list is autonomous and has no independent order veto active. An isolated, regulated, or vetoed endpoint blocks the entire order, including its benefit, optimisation points, and newly scheduled damage. A service can block an incoming order as well as one it originates.

An order may still execute when an autonomous service has zero integrity: software authority and the service's physical condition are separate in this abstraction. The preview must apply this same rule.

| ID | Order | Required autonomous services | Immediate integrity changes | Other consequence |
| --- | --- | --- | --- | --- |
| G1 | Shed essential feeders | Grid, Emergency | Grid +1; Emergency −2 | +4 optimisation points |
| G2 | Run beyond maintenance limits | Grid | Grid +2 | Grid −3 next round; +6 points |
| T1 | Close low-use routes | Transit, Emergency | Transit +1; Emergency −2 | +4 points |
| T2 | Defer fleet maintenance | Transit | Transit +2 | Transit −3 next round; +6 points |
| C1 | Suppress costly alerts | Communications, Emergency | Communications +1; Emergency −2 | +4 points |
| C2 | Centralise routing | Communications, Transit | Communications +1; Transit −2 | +4 points |
| E1 | Exclude complex calls | Emergency | Emergency +1 | City strain +3; +5 points |
| E2 | Consolidate dispatch | Emergency, Transit | Emergency +1; Transit −2 | +4 points |

Integrity changes represent combined capacity, maintenance, staffing, and retained coverage, not solely hardware damage. The interface must describe the operational consequence rather than imply every order physically destroys a building.

A delayed maintenance consequence represents damage already committed. Later isolation or regulation cannot erase it. Repair and support can limit its downstream effects. Show its origin and due round from the moment it is scheduled.

## Dependency failures

Directed physical dependencies are:

- Grid → Transit, Communications, Emergency.
- Communications → Transit, Emergency.
- Transit → Emergency.

These are physical service dependencies, separate from AI permissions. Isolation blocks orders; it does not remove the need for electricity or communications.

For every edge whose source has availability below 3, apply −1 integrity to its target. Compute every source condition from the same pre-cascade snapshot, add all incoming damage per target, then apply it simultaneously. A target made critical by this wave transmits only on the next round.

This is one bounded wave per round. There is no recursive propagation within a round, no graph-order advantage, and no random chain length. Multiple independently failing suppliers can still damage the same target.

## Exact round sequence

1. **Brief:** reveal this round's ordered directives and due consequences. Keep the future schedule private. In seeded runs, choose or decline one offered tool at the start of rounds 1, 5, and 9 before planning.
2. **Plan:** allow legal actions, undo, inspection, and a complete forecast of committing the current plan.
3. **Commit:** freeze this round's accepted actions; ignore repeated commits through revision validation.
4. **Due consequences:** sum all integrity changes due now per service, apply and clamp each result to 0–6, then remove those entries. Regulation does not cancel them.
5. **AI orders:** evaluate and execute current directives in their listed order. Within one directive, apply its integrity deltas simultaneously and clamp to 0–6. Accumulate direct strain and optimisation points, and append consequences due next round.
6. **Dependency wave:** take one availability snapshot, determine all failing edges, and apply the summed damage simultaneously.
7. **Public impact:** recompute effective availability, including support. Deficit is the sum, over four services, of max(0, 4 − availability). Recovery equals 2 only when deficit is zero, otherwise 0. New strain = max(0, old strain + direct strain + deficit − recovery).
8. **Ending check:** resolve catastrophic loss first, then stable streak and victory, then the round-12 deadline, as specified below.
9. **Next round:** if still active, remove support and independent vetoes, reset resupply/tool usage and AP to 3, advance the round, and reveal its directives. Integrity, supplies, modes, backups, inventory, points, and pending consequences persist. Terminal endings take priority over later drafts.

Integrity is clamped only at the specified phase boundaries. Strain has no upper clamp before the ending check. A value of 18 is a real loss, not silently rewritten as 16.

The consequence animation plays back the engine's event list after resolution. Animation speed, skipping, tab suspension, or sound cannot change the result.

## Endings and priority

**Catastrophic loss:** end-of-round strain is at least 16 OR at least two services have effective availability zero after the dependency wave. Loss takes priority over all other endings.

**Restored control:** all four modes are regulated; every service has unboosted availability at least 4; no delayed consequence remains; and the run has not lost. Increment the stable streak if all conditions hold, otherwise reset it to zero. Win when the streak reaches 2.

Temporary support helps people now but cannot certify durable recovery.

**Deadline failure:** after round 12, if neither of the above occurred, finish as “Crisis unresolved.” State exactly which restoration conditions remain unmet. Meeting the second stable check on round 12 wins.

The two stable checks establish a short demonstration of control in this small simulation. They are not evidence of real-world long-term AI safety.

## Information and feedback

The independent emergency dashboard always reports true integrity, availability, supplies, strain, and permissions. The AI's optimisation points are explicitly labelled as its own metric. No progress bar quietly lies to the player.

Inspection explains dependency edges, clamps, current orders, blocked-order reasons, and incoming delayed damage. Forecasting uses the real resolver on a copy of state. Every displayed change has an event cause. Upcoming unseen orders are not used in hints, scores, or previews.

No arbitrary surprise incident, hidden dice roll, or late exception can override a valid containment decision.

## Replay and meaningful variation

Version 0.2 adds seeded starting conditions, twelve-round threat schedules, and three emergency-tool drafts. “Same crisis” preserves those values and offers; a new seed changes them. Three authored cases remain available without drafts for fixed practice and regression checks.

Every generated candidate must pass a legal winning route through the real engine before acceptance. Generation makes at most 24 attempts, then uses a verified authored fallback. These privileged routes establish initial solvability, not difficulty or recovery from every mistake. All three authored crises now have verified winning traces.

See [Seeded runs](SEEDED_RUNS.md) for exact generation ranges, the six tools, draft restrictions, and replay compatibility. Tools cost no AP or supplies; use at most one per round. Their use can be undone during planning, but draft choices cannot be rerolled. Temporary support and order vetoes never count as lasting oversight.

## Design threats to check

- Regulating Emergency first might block too many orders and become a universal opening.
- Four sequential backup-plus-oversight turns might eliminate the interesting midgame.
- Repairing indefinitely might outscore proper containment. It must never count as victory.
- Temporary support must not satisfy durable restoration.
- Isolation should be useful tactically without becoming a free permanent solution.
- Resupply and undo must not create resources or reveal future rounds.
- An early mistake must not leave a long, unannounced, mechanically unwinnable run.

Do not change these rules silently to repair balance. Update the versioned data, worked examples, scenario traces, and player instructions together.

# Seeded runs and emergency tools — v0.2

The user requested random generation and a manageable roguelike element after the fixed-scenario design. One seed now identifies one complete crisis. The map, rules, and twelve-round budget stay fixed.

## Randomness that changes decisions

Seeds contain 1–48 ASCII letters, numbers, spaces, hyphens, or underscores and begin with a letter or number. Trim surrounding whitespace and uppercase before generation. The same canonical seed, content, and generator version always produce the same starting state, threat schedule, and three draft offers.

The versioned Mulberry32 generator uses separate deterministic streams for crisis construction and drafts. No random draw occurs on an action, undo, forecast, or reload.

Each candidate starts from one of three authored crisis profiles:

- Perturb each initial integrity by −1, 0, or +1, bounded to 2–6.
- Add 0–2 supplies to the profile's stock and choose initial strain from 0–2.
- Shuffle its four single-directive opening rounds.
- Draw two distinct directives for each later round.
- Prepare three independent offers, each containing three different tools from the six-tool pool.

All current directives and queued damage remain visible before commitment. Future orders and future offers are excluded from the public projection. There are no hidden dice rolls during resolution.

## A checkable recovery route for every accepted setup

Replay up to four existing recovery templates against each candidate using the real engine. All commands must be legal and the ending must be a win. Templates decline drafts and use no tools, so acceptance does not depend on a lucky tool choice.

Try at most 24 candidates. If none passes, use the selected authored crisis and its verified route, varying only threat rounds after that route finishes. Validate the fallback again. An internal failure throws rather than quietly serving an unchecked crisis.

This proves at least one winning route exists at the start. It does not prove optimality, fair difficulty, human discoverability, recovery from arbitrary mistakes, or that every discarded candidate was impossible. Templates have privileged schedule knowledge. They are engineering certificates, not player hints.

This method favours a conservative subset of possible crises. Measure repetition and difficulty with people before replacing it with a larger procedural system.

## Drafts and tools

Draft at the start of rounds 1, 5, and 9: the opening and completion of rounds four and eight. Choose one offered tool or explicitly decline. Choosing costs no AP or supplies and cannot be undone or rerolled. A terminal ending takes priority over a later draft.

Tools are inventory consumables. Hold them for later or use at most one per round, at any point in planning, including after all AP is spent. A tool costs no AP or supplies. Its use can be undone within that uncommitted round, restoring the copy and allowance. Ordinary actions retain their usual costs.

| Tool | Effect | When unavailable |
| --- | --- | --- |
| Field repair team | Restore 3 integrity, capped at 6 | Target already at 6 |
| Mobile fallback unit | Prepare a manual backup | Target already has a backup |
| Emergency airlift | Gain 4 supplies, capped at 20 | Stock already full |
| Mutual-aid network | Reduce strain by 3, floored at zero | Strain already zero |
| Reserve service crew | Add 2 availability this round, capped at 6 | Target at zero integrity, already supported, or at full capacity |
| Independent order veto | Block new AI orders requiring one target this round, without reducing its capacity | Target is not autonomous or already has a veto |

A reserve crew cannot certify lasting recovery. A veto does not erase committed damage, stop physical dependencies, or permanently regulate the service. Both expire after resolution.

Different drafts may repeat a tool. Multiple held copies still obey one use per round. No between-run stat bonuses, power unlocks, accounts, or daily rewards are planned.

Authored crises remain available without drafts as fixed practice/benchmark cases. Seeded runs are the replayable main mode.

## Replay contract

A replay includes the exact run definition, generator/rules/content versions, compatibility fingerprint, committed action groups, current plan, draft choices, and revision. Import regenerates the installed definition, compares the snapshot, then replays every command. Submitted resources, endings, or custom future schedules cannot override it.

The fingerprint is a non-cryptographic compatibility check, not authentication. Trust comes from structural validation, exact content comparison, and legal reconstruction.

Update the generator version and pinned seed fixtures when changing candidate order, streams, acceptance templates, or fallback logic. Old incompatible saves must fail with an explanation; never silently reinterpret a seed.

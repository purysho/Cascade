# Cascade handoff — Stage 1

Date: 25 September 2026. Repository: https://github.com/purysho/Cascade.

## User direction

Build Cascade for Mangrove Game Night. Unregulated AI creates escalating, visible danger; the player must contain it and establish durable control. Rules and architecture came first. The user then authorised implementation and requested random generation for replayability, preferably with a small roguelike layer, while keeping the game fun and the one-day scope manageable.

## Completed

- Strict TypeScript engine: seven actions, eight directives, delayed consequences, one-wave dependencies, all endings, causal events, forecasts, undo, stale-command rejection.
- Three authored crises and executable recovery routes for all three.
- Seeded initial conditions and twelve-round schedules, checked against real-engine winning routes before acceptance; bounded fallback.
- Six one-shot emergency tools; drafts at rounds 1, 5, and 9; one tool use per round.
- Public view excludes unrevealed orders and future tool offers.
- Bounded, versioned replay export/import reconstructs state from legal commands and installed content. Browser storage is not implemented.
- Locked development dependencies, Node built-in tests, stress and strategy tools, and GitHub Actions workflow.
- Original arithmetic fixtures pass unchanged. Evidence: [VERIFICATION.md](docs/VERIFICATION.md).

## Run and inspect

~~~sh
npm ci --ignore-scripts
npm run check
npm run demo -- CASCADE
npm run strategies
~~~

Use Node 24+. Native TypeScript stripping executes the source; the compiler checks strict types separately. No production dependencies exist.

Start at src/index.ts. Create runs with createAuthoredRun(id) or createSeededRun(seed). Commands use applyCommand(state, command) with expectedRevision. Render only projectForPlayer(state). Forecasts and commits share the same resolver.

Read docs/GAME_RULES.md, docs/SEEDED_RUNS.md, docs/ARCHITECTURE.md, and docs/VERIFICATION.md before UI work.

## Next scoped task — Stage 2

Build one complete playable browser match: entry → seed/authored choice → tool draft → city controls → forecasts/undo → consequences → ending → same-seed replay/new seed.

Use the engine unchanged unless a verified contradiction needs fixing. Keep the fixed four-service map. Explain AP and supply costs, temporary versus lasting control, current unsafe orders, and committed damage. Help and disabled reasons must be accessible.

After the match works in memory, add guarded browser saves using the replay adapter, then a self-contained file-compatible offline export. Test the rendered game and extracted offline package; the terminal demo does not satisfy browser or delivery gates.

Then finish Stage 3 tutorial/instructions, Stage 4 original visuals/audio, Stage 5 browser/balance checks, and Stage 6 playable package/credits/demo materials. Relevant frontend design/testing skills should guide the rendered build.

## Findings and limits

The generator verifies solvability with four recovery templates. This is conservative rejection sampling, not an exhaustive solver or a guarantee that every mistake is recoverable. Certificates have privileged knowledge and must not drive hints.

The 1,000-seed sample had 572 distinct initial states, 72 opening threat orders, and one verified fallback (STRESS-336). Every seed reproduced and every certificate won.

In a separate 27-crisis comparison, each of four fixed-first regulation policies and an adaptive policy won all cases using only current information and one-round forecasts. Their speeds differed. No intervention and indiscriminate shutdown collapsed; repair-only reached the unresolved deadline. This does not establish compelling difficulty. Prioritise new-player comprehension, pacing, and whether tools create interesting choices before expanding content.

No rendered UI, browser storage, original artwork, tutorial implementation, audio, browser/Windows test, downloadable playable release, or human playtest exists yet.

## Delivery boundaries

Check remote main and preserve later edits when resuming. Stage 0's remote baseline was 41955270630164a4eff31b793635c8f6955849e2; Stage 1 follows it. Use the actual current branch head.

Repository pushes are authorised. Website deployment and competition submission have not been requested. Event registration and additional participant rules remain unresolved; consult docs/COMPETITION.md and recheck current requirements before claiming entry readiness.

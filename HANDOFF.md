# Cascade handoff — Stage 3

Date: 26 September 2026. Repository: https://github.com/purysho/Cascade.

## Completed through Stage 3

Stage 2 remains intact: deterministic engine, seeded roguelike crisis generation, live city presentation, exact forecasts, browser save/resume, endings/replay, and Chrome verification.

Stage 3 adds four guided exercises:

1. **Read the danger** — inspect a live Grid optimisation, compare the exact forecast, then observe Grid improve while Emergency is harmed.
2. **Break the cascade** — repair a Grid below the dependency threshold and verify predicted downstream failures disappear before commitment.
3. **Contain safely** — prepare Transit backup, isolate it, retain capacity 3/6, and observe the current unsafe order being blocked.
4. **Restore control** — prepare Communications backup and spend the remaining 2 AP to install permanent human oversight.

### Important implementation boundary

The first Stage 3 attempt was abandoned and PR #2 was closed. The successful retry deliberately leaves the core run/replay type system untouched.

Training lives in `web/tutorial.ts`. It creates short session-only GameStates by reusing the installed Stage 2 rules/content identity and calling the normal `createRun` engine path. Tutorial sessions are never written to the campaign save slot or exported as campaign replays. Generated crises, `RunDescriptor`, replay validation, generator content, and the core content hash are unchanged.

Tutorial progress is evaluated from real GameState / public forecast predicates, not button coordinates. Reset creates the exercise again from its verified start. Hints are requested explicitly. Exit returns to the main menu. Completing exercise four enables transition into a generated crisis.

## Verification

The clean retry passed the existing Stage 2 checks unchanged:

- strict TypeScript checks;
- 33 engine/regression/adversarial tests;
- 1,000 deterministic generated crises with verified winning certificates;
- 1,000 automated sessions with replay checks;
- browser build;
- existing generated-crisis save/reload/resume Chrome smoke.

The extended Chrome smoke additionally completes all four tutorial exercises through the rendered UI and verifies that leaving training does not hide or overwrite the previously saved campaign.

The browser test exposed one viewport interaction edge: Chrome auto-scrolled the lower Enforce Oversight control under the sticky End Round bar at the 1440×757 test viewport. The smoke interaction now scrolls targets to the safe center before clicking, matching normal user scrolling; the full flow passes.

## Next stage

Stage 4: sound cues and final presentation polish. Keep audio local/offline and optional, derive consequence sounds from real engine events, preserve reduced-motion/mute controls, and avoid turning feedback into extra game state.

Then proceed to broader browser/Windows checks and human playtesting before the final self-contained offline package.

## Remaining limitations

- No human first-time tutorial observation yet; automated completion does not prove comprehension.
- No audio yet.
- Chrome desktop is the only automated rendered environment.
- Multi-tab save-conflict handling remains unimplemented.
- Final single-file `Cascade-Play.html` and extracted ZIP verification are not built.
- Competition deployment/submission has not been authorised.

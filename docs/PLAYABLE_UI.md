# Living city browser interface

Status: Stage 2 implemented.

## Design goal

The city must feel active before, during, and after the player's decisions. Unchecked AI is not confined to story text: current unsafe directives remain visibly active on the map while the player plans. The player sees services operating, degraded capacity changing the environment, and the exact current cascade risk connecting systems together.

This is deliberately a lightweight city-simulation presentation rather than a second simulation engine. The deterministic rules remain authoritative.

## Runtime layers

1. **Domain engine** — GameState, legal commands, forecasts, consequences, endings.
2. **Player projection** — `projectForPlayer(state)`; the browser must not receive unrevealed schedules through its rendering API.
3. **DOM operations console** — actions, costs, disabled reasons, orders, forecast, help, results.
4. **Canvas city** — continuous world feedback derived from the player projection.
5. **Replay storage adapter** — saves only the validated replay envelope and reconstructs state through legal commands.

## Live-world mappings

| Engine signal | World presentation |
| --- | --- |
| Grid availability | Lit/flickering building windows |
| Transit availability | Vehicle movement speed / stopped traffic |
| Communications availability | Packet pulses between services |
| Emergency availability | Moving response vehicle |
| Autonomous control | Rotating/scanning ring |
| Regulated control | Stable human-oversight ring |
| Current unchecked directive | Continuous orange source pulse and harm pulse toward negatively affected services |
| Blocked directive | Green/dashed containment pulse |
| Forecast dependency failure | Pulsing failure link along the real dependency edge |
| Pending delayed damage | Countdown/damage badge attached to target service |
| High public strain | Increasing city-edge danger vignette |

The animation consumes no random gameplay draws. Cosmetic building/vehicle placement is seed-stable and does not affect state.

## Replayability

A generated run changes:

- initial service integrity;
- starting supplies/strain within generator rules;
- current/future directive schedule;
- tool offers;
- seed-stable city arrangement.

The first four are gameplay-relevant. The final item prevents every run from looking identical without pretending cosmetic variation itself creates strategy.

## Browser persistence

After every accepted command the controller tries to store `exportReplay(state)`. Reload uses `importReplay`; incompatible, malformed, or forged state is rejected by the existing replay adapter. If storage is unavailable, the game continues in memory and tells the player once.

## Accessibility

- Critical state uses text, number, shape, and labels rather than colour alone.
- Reduced-motion preference is detected, and the player can additionally reduce motion.
- Disabled operations remain visible with their engine-provided reason.
- The forecast and causal trace expose the same consequences represented by animation.

## Verification

GitHub Actions builds the web target and drives the rendered game through ChromeDriver without adding a browser-test dependency. The current smoke path covers start, seed entry, draft, action, undo, commit, save, reload, and resume, then records a screenshot and checks for SEVERE browser-console entries.

The automated rendered check is not a human playtest and does not establish fun, readability at all sizes, or tutorial comprehension.

# Cascade handoff — Stage 4

Date: 26 September 2026. Repository: https://github.com/purysho/Cascade.

## Completed through Stage 4

Cascade now has the deterministic rules engine, seeded roguelike-lite crisis generation, live browser city, guarded save/replay, four session-only guided exercises, and Stage 4 sound/consequence feedback.

Stage 4 is intentionally presentation-only. It does **not** change RunDescriptor, replay import/export, generator content, the core content hash, action costs, forecasts, or round resolution.

### Offline procedural audio

`web/audio.ts` uses the browser Web Audio API and creates short synthesized cues at runtime. No remote files, copyrighted sound pack, backend, or network request is needed.

Audio is derived from user actions and committed DomainEvents:

- operations / tools: short confirmation cue;
- undo: reverse cue;
- emergency-tool draft choice: two-step cue;
- order executed / queued damage: warning cue;
- order blocked: containment cue;
- dependency failure / delayed damage: low failure cue;
- win, collapse, and deadline: distinct terminal cues.

Sound is optional. The start screen and in-game topbar expose synchronized **Sound: On / Muted** controls. The preference is stored with the existing optional presentation settings and is never part of game/replay state. AudioContext creation remains lazy so browser autoplay restrictions are respected.

### Consequence feedback

Committed round events now create two additional feedback layers:

1. a short control-room banner that summarizes the most important actual outcome of the round;
2. map shock rings anchored to the real affected service when the event exposes a service target, or to the city center for city-wide/terminal outcomes.

The feedback priority is terminal outcome → cascade/delayed damage → unchecked AI order → blocked order → neutral strain recalculation.

Reduced-motion mode keeps the banner and a static ring instead of animated expansion. These effects are representational only; they cannot change or invent consequences.

### Build verification hardening

The browser build now explicitly requires the emitted `web/audio.js` and `web/tutorial.js` modules in addition to the existing entry files.

The Chrome smoke now verifies:

- the visible start-screen sound control;
- mute preference persistence across reload;
- generated crisis → tool draft → legal action → undo → round commitment;
- visible Stage 4 consequence feedback from committed engine events;
- save / reload / resume;
- all four guided training exercises;
- training does not overwrite the campaign save;
- no SEVERE browser-console entries.

CI retains three rendered screenshots:

- `verification/browser-smoke.png`
- `verification/tutorial-smoke.png`
- `verification/stage4-feedback.png`

## Architecture rules to preserve

- `GameState` remains authoritative.
- Browser UI renders `projectForPlayer(state)`.
- Forecast and committed resolution continue to share the same deterministic resolver.
- Animation, sound, banners, and shock rings may only represent player-visible state/events; they must never create gameplay effects or expose hidden future information.
- Tutorial remains session-only and outside campaign persistence.
- Sound/motion preferences remain presentation settings, not replay data.

## Current verification baseline

Before Stage 4 merge, the required green gate is:

- strict TypeScript checks;
- 33 engine/regression/adversarial tests;
- 1,000 deterministic generated crises with verified winning certificates;
- 1,000 automated sessions with replay reconstruction checks;
- browser build including audio/tutorial modules;
- generated-crisis Chrome smoke;
- full four-exercise tutorial Chrome smoke;
- sound-setting persistence and Stage 4 consequence-feedback smoke.

## Next stage — Stage 5

Do broader rendered and human validation before adding more mechanics.

Priority:

1. Windows desktop run with the offline browser build.
2. Chrome plus at least one additional mainstream browser if practical.
3. First-time human playtests: can players understand the objective, forecast, isolation/backup tradeoff, oversight, tools, and why a cascade occurred?
4. Record actual match duration, confusion points, strategy variety, tool use, and whether players want to replay a new seed.
5. Fix only observed comprehension/game-feel problems; avoid expanding scope without evidence.

Then Stage 6 can produce the self-contained `Cascade-Play.html`, extracted ZIP verification, credits/disclosures, and demo/submission materials.

## Remaining limitations

- No observed human playtest yet; automated browser completion does not establish fun, comprehension, difficulty, or replay desire.
- Audio presence is automated only at the control/event-routing level; headless CI cannot prove subjective loudness/mix quality.
- Chrome desktop is the only automated rendered environment.
- Multi-tab save-conflict handling remains unimplemented.
- Final single-file `Cascade-Play.html` and extracted ZIP verification are not built.
- Competition deployment/submission has not been authorised.

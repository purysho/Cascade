# Cascade — architecture v0.1

Status: proposed implementation contract. File paths below describe the future source layout; they do not imply those modules already exist.

## Design decisions

| Decision | Reason |
| --- | --- |
| TypeScript with strict checking | Explicit state transitions and small, testable contracts |
| Plain DOM controls and an SVG city | Four nodes and a small action set need no large game framework; native controls support keyboard access |
| Vite for local development and the hosted production build | Keep ordinary development and preview tooling simple |
| Separate self-contained offline build | Double-click delivery needs an explicitly tested file-compatible bundle |
| Pure deterministic rules engine | Tests, previews, tutorials, replays, and gameplay must calculate the same result |
| Authored scenario schedules | Bound the content and make outcomes reproducible before adding generation |
| No runtime network or live model calls | Predictable availability, cost, privacy, and behaviour |

Resolve compatible package versions when implementation begins, pin them in the lockfile, and record the toolchain. There is currently no package manifest or claim that dependencies have been installed.

## Module boundaries

~~~mermaid
flowchart TD
  Data["Versioned rules and scenarios"] --> Engine["Deterministic rules engine"]
  Input["Validated player commands"] --> Engine
  Engine --> Events["Resolution events"]
  Engine --> View["Public view and forecast"]
  View --> UI["City and controls"]
  Events --> UI
  Engine --> Save["Save and replay adapter"]
  Save --> Engine
~~~

The engine has no DOM, browser storage, audio, network, wall-clock, animation, or framework dependency. UI modules receive public projections. A single application controller owns the full state and sends commands through the engine.

Suggested modules:

| Path | Responsibility |
| --- | --- |
| src/domain/types.ts | Service IDs, commands, phases, state, effects, events, errors |
| src/domain/validate.ts | Runtime validation of authored data and save/replay inputs |
| src/domain/availability.ts | One authoritative availability derivation |
| src/domain/actions.ts | Legal actions, resource costs, immediate effects |
| src/domain/resolve.ts | Due effects, ordered directives, one-wave cascade, public impact |
| src/domain/endings.ts | Loss priority, durable recovery streak, deadline |
| src/domain/project.ts | Player-visible state and current-round preview |
| src/domain/replay.ts | Reconstruct a run from versioned content and commands |
| src/content/ | Validated rules, scenarios, copy, tutorial checkpoints |
| src/app/controller.ts | Accepted revisions, planning history, save calls, screen transitions |
| src/ui/ | City SVG, panels, help, focus, animation playback, result screen |
| src/platform/ | Storage, optional audio, downloads, reduced-motion preference |
| tools/ | Export, archive verification, deterministic stress runner |
| tests/ | Golden cases, invariants, strategy traces, browser checks |

Do not make a second tutorial engine, a second forecast formula, or separate “easy mode” arithmetic.

## State contracts

A GameState contains:

- Schema, rules, and content versions; rules/content hashes; scenario ID.
- Round 1–12; planning or terminal phase; monotonic accepted-state revision.
- Four service records containing integrity, mode, backup, and this-round support.
- Supplies, strain, optimisation points, AP remaining, and resupply-used flag.
- Delayed effects with stable IDs, source directive, originating round, due round, target, and signed delta.
- Stable streak and an optional terminal result.
- Current round's directive IDs, resolved from the immutable scenario.
- Canonical committed round/action history plus the current open plan.

The application also keeps the current round's starting state for undo and the most recent immutable ResolutionResult for animation. Neither may independently override authoritative state.

Availability, legal buttons, blocked orders, deficit, forecast, and restoration checklist are derived. Do not persist them as independently editable state.

Conceptual API:

~~~ts
type ServiceId = "grid" | "transit" | "comms" | "emergency";
type Mode = "autonomous" | "isolated" | "regulated";
type TargetAction =
  | "repair" | "prepare_backup" | "isolate"
  | "restore_automation" | "enforce_oversight" | "emergency_support";
type Command =
  | { type: "act"; action: TargetAction; target: ServiceId; expectedRevision: number }
  | { type: "act"; action: "resupply"; expectedRevision: number }
  | { type: "undo"; expectedRevision: number }
  | { type: "commit_round"; expectedRevision: number };

type Reduction =
  | { ok: true; state: GameState; events: DomainEvent[] }
  | { ok: false; state: GameState; error: RuleError };

createRun(content: ValidatedContent, scenarioId: string): GameState;
applyCommand(state: GameState, command: Command): Reduction;
forecastCommit(state: GameState): ResolutionResult;
projectForPlayer(state: GameState): PublicView;
replayRun(bundle: ValidatedReplay, content: ValidatedContent): ReplayResult;
~~~

These are interface sketches, not compiled declarations. Implement full discriminated unions and runtime validators in Stage 1.

Errors identify the reason and target: insufficient AP, insufficient supplies, invalid mode, backup required, integrity too low, already used, stale revision, terminal state, or invalid data. Never spend a resource before validation completes.

## Resolution and event contracts

Every state-changing result emits stable, ordered event records. Each includes round, phase, source, target, actual before/after values, and a cause ID. A clamped gain records its actual change. Blocked directives record all blocking endpoints and schedule no delayed effect.

Events cover action accepted, order blocked/executed, effect queued/applied, dependency damage, public deficit/recovery, and ending. Multiple source edges contributing to one target retain separate causal records alongside the summed result.

The resolver uses the exact sequence in the rules. Dependencies are evaluated against one frozen availability snapshot. Iterating services in a different object order must not change the result.

The preview calls the same resolver on an isolated copy. It must not advance the real state, mutate content, consume a save revision, or reveal future directives. Accepted command plus identical initial content always gives identical events and final state.

Rendering an animation is optional playback of those events. The engine is already finished. During playback, game actions are unavailable; Skip finishes playback without rerunning the resolver.

## Information boundary

PublicView includes current independent telemetry, current directives, due effects, resources, allowed actions, forecast, and the restoration checklist. It excludes future schedule entries.

Hints use only this view and current-round projection. They cannot choose an action by reading the next unrevealed card.

The offline package necessarily contains scenario data that a technically curious player can inspect. This is an interface fairness rule, not an anti-cheat or secrecy guarantee.

## Replay, undo, and saves

Store a versioned scenario snapshot, its ID/hash, and canonical committed action groups. Reconstruct rather than trusting imported integrity, supplies, or terminal flags. Store an open action list for restoring an unfinished planning round.

The canonical V1 run has at most 12 committed rounds and at most 3 accepted actions per round; an open plan has at most 3. Undo removes an action from the open plan and recomputes from the round-start snapshot. Undo history is not an unbounded replay log.

Validate imported JSON size (initial limit 256 KiB), nesting/shape, IDs, bounded counts, versions, hashes, and every replayed action. Use installed, validated content. Reject unknown or incompatible content with an explanation and preserve the original file. Never evaluate imported strings or put them into HTML.

Save after each accepted planning change and committed round. Save only engine state/history, not partially played animation. Reload shows the authoritative current planning state or terminal result, with the last committed recap available.

Use a small localStorage adapter with caught read/write/parse errors. Keep playing in memory if storage is unavailable or full. Display “Progress cannot be saved on this browser” once, and offer replay export. Two tabs may each continue their own run; save records carry run ID and revision, and a conflicting newer record is preserved instead of silently overwritten.

Settings and tutorial progress have separate versioned records. Beginning another crisis asks about discarding an active run; inspecting help never resets it.

## Offline and hosted outputs

The intended outputs are:

- dist/: ordinary static web assets for a future authorised host.
- release/Cascade-Play.html: one self-contained, file-compatible playable entry.
- release/START-HERE.md, CREDITS.md, VERIFICATION.md, and source archive.
- A ZIP containing the checked playable entry and those accompanying files.

The offline export must inline styles, validated scenario data, essential artwork, and a single classic-script/IIFE bundle. It must contain no module imports, runtime fetches, remote fonts, CDN scripts, worker dependencies, or missing absolute asset paths. Any audio must be embedded or generated locally after a user gesture.

A normal Vite build is not assumed to work when double-clicked. Verify the actual extracted file using file:// with network disabled. Separately test the served production build; development-server success proves neither packaging path.

Vite's own documentation distinguishes its local preview server from production hosting: https://vite.dev/guide/static-deploy.html.

No deployment is part of this design stage.

## Build safety and maintenance

Pin dependencies, keep the runtime dependency list small, and avoid dynamic code evaluation. An engine/content change increments the appropriate version and updates golden traces. Keep one manifest linking the delivered build, source commit, rules/content hashes, and checks.

Use bounded loops: four services, six edges, at most two orders per authored round, and at most two newly scheduled delayed effects. Save/replay validation prevents malicious or accidental large inputs from bypassing these limits.

No accounts, telemetry, API keys, or server data are needed. Cosmetic timestamps and animation timing are excluded from state hashes.

## Open architecture checks

- Prove the selected bundler/export configuration works under file://.
- Verify storage behaviour in the actual supported browsers rather than assuming consistency.
- Decide the exact small test runner after inspecting the implementation environment.
- Port the arithmetic review to the real engine; a separate design calculator is not production validation.

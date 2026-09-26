# Cascade — architecture v0.2

Status: Stage 1 engine implemented. UI, browser storage, bundling, and the offline playable package are planned.

## Technology

Strict TypeScript 5.9.3, Node 24+ native TypeScript execution, and the built-in Node test runner. Development dependencies are pinned in package-lock.json. There are no runtime packages, DOM, storage, network, wall-clock, animation, or live-model dependencies in the engine.

The planned interface remains plain DOM controls with an illustrated/SVG city. Vite and a separate file-compatible export are future build tools, not installed features.

## Boundaries

~~~mermaid
flowchart TD
  Content["Versioned content"] --> Generator["Seeded crisis generation"]
  Content --> Engine["Deterministic engine"]
  Generator --> Engine
  Commands["Validated commands"] --> Engine
  Engine --> Public["Current view and forecast"]
  Engine --> Events["Causal events"]
  Public --> UI["Planned interface"]
  Events --> UI
  Replay["Validated replay"] --> Engine
~~~

| Module | Implemented responsibility |
| --- | --- |
| src/domain/types.ts | Commands, services, state, events, endings, run definitions |
| src/domain/validate.ts | Content and command validation, canonical encoding, compatibility fingerprints |
| src/domain/availability.ts | One availability formula and restoration checklist |
| src/domain/actions.ts | Legality, costs, immediate actions and consumable tools |
| src/domain/resolve.ts | Due damage, ordered directives, simultaneous dependencies, impact, endings |
| src/domain/engine.ts | Creation, revisions, draft transitions, planning, undo, commitment |
| src/domain/project.ts | Public state, current directives, disabled reasons, current forecast |
| src/domain/random.ts | Versioned deterministic PRNG and canonical seed handling |
| src/domain/generate.ts | Candidate construction, actual-engine recovery checks, bounded fallback |
| src/domain/replay.ts | Bounded JSON import, exact definition matching, legal reconstruction |
| src/content/catalog.ts | Load, validate, fingerprint, and freeze versioned rules/scenarios |
| src/index.ts | Public engine entry points |
| tests/ | Original golden traces, rule boundaries, generation, drafts, replay and adversarial cases |
| tools/ | Engine demo, certificate search, stress sample, public-information strategy comparison |

## Public API

~~~ts
createAuthoredRun(id: string): GameState;
createSeededRun(seed: string): GameState;
applyCommand(state: GameState, input: unknown): Reduction;
forecastCommit(state: GameState): Resolution;
projectForPlayer(state: GameState): PublicView;
exportReplay(state: GameState): string;
importReplay(text: unknown): ImportResult;
~~~

PublicView and ImportResult describe inferred return types; exported domain types live in types.ts. See src/index.ts and executable examples in tools/demo.ts.

Commands carry expectedRevision and one of:

- act: one of seven operational actions and the target, if applicable.
- use_tool: a held consumable and its target, if applicable.
- choose_tool: one offered ID or null to decline.
- undo: remove the last uncommitted operation.
- commit_round: resolve exactly one round.

Malformed input, stale revisions, invalid phases, costs, or preconditions return an error and the unchanged original state. Valid commands return a new state and increment revision. A repeated command with the old revision cannot resolve another turn. Unknown properties are rejected.

## Authoritative state

A frozen Definition contains versioned content identity, authored ID or canonical seed, the complete scenario snapshot, and all offers. GameState holds:

- Core: round, planning/draft/terminal phase, four service states, AP, supplies, strain, AI points, pending damage, stable streak, inventory, per-round flags, and ending.
- Round-start core snapshot for undo.
- Committed round/action groups, open operations, draft choices, and monotonic revision.

Availability and restoration requirements are derived, never competing saved values. Core snapshots are cloned before mutation. Definition and installed content are frozen.

Undo rebuilds the open round from its start and remaining legal operations. It restores tools and budgets without rerolling offers, changing the schedule, or decreasing revision. A draft choice cannot be undone. The canonical plan has at most three AP-costed actions plus one tool operation.

## Resolution and events

Use the exact sequence in GAME_RULES.md. The resolver has no random draws. Due effects aggregate before clamping; directives execute in listed order; all dependency source conditions use one frozen snapshot. Endings run after public impact.

A Resolution contains the completed round's core and ordered causal events, without advancing to future orders. Events record round, phase, source/cause, targets, actual before/after changes, blocked endpoints, queued/applied damage, individual failing edges, public impact, and the ending.

forecastCommit invokes the same resolver as commit. Commit then advances the round, expires support/vetoes, resets budgets, and enters a draft when appropriate. The public forecast returns only the just-resolved round, preventing accidental disclosure of next-round content.

The planned UI must play back events as an animation after the engine has finished. Skip, mute, timing, and tab suspension must not rerun or alter resolution.

## Information boundary

The application controller will own GameState. Components receive only projectForPlayer(state): current telemetry, current orders, due damage, current draft offer, legal actions and disabled reasons, restoration requirements, and the exact forecast.

No future schedules, later offers, or winning certificates are in that projection. Strategy comparisons in tools/policies.ts receive only this projection and evaluate one current round. The privileged certificate search is clearly separate.

An offline player could inspect bundled content. This is an interface fairness boundary, not an anti-cheat promise.

## Generation

One seed fixes all initial conditions, threat ordering, and draft offers. Candidate and draft streams are independent. Every accepted candidate passes a legal recovery certificate through the same engine; at most 24 attempts precede a checked fallback. See SEEDED_RUNS.md for exact ranges and limitations.

The generator proves existence of a route, not fair difficulty. Certificates must never become hints that exploit unrevealed orders.

## Replay and future saves

The implemented replay envelope stores the definition snapshot, content and definition fingerprints, history, open plan, choices, and revision. Import limits text to 256 KiB, depth to 24, rounds to 12, operations to four per round, and choices to three. It rejects incompatible or malformed content before reconstruction.

Import recreates the authored or seeded run from installed content, compares the exact definition, then reapplies every command. It never trusts imported resources or an ending. The FNV-1a 64-bit fingerprint is a compatibility check, not authentication; exact content comparison and legal replay enforce validity.

Undo operations disappear from canonical history but increment revisions. Imported revision must be at least the reconstructed command count and at most one million.

Still to implement: guarded localStorage, save-after-command integration, reload recaps, storage-failure notification, export download, versioned settings/tutorial progress, and conflict handling for multiple tabs. Keep playing in memory if storage fails; preserve a conflicting newer save rather than silently overwriting it.

## Planned playable outputs

- dist/: ordinary static assets for a future authorised host.
- release/Cascade-Play.html: self-contained file-compatible game.
- START-HERE.md, CREDITS.md, verification record, source archive, and ZIP.

Inline essential images, styles, content, and one classic-script/IIFE bundle. No runtime imports, fetches, remote fonts, CDN scripts, or missing absolute asset paths. Any audio must be embedded or created locally after a gesture.

Test the actual extracted file under file:// with the network disabled, separately from the served production build. Development-server success proves neither packaging path.

## Verification and remaining risks

npm run check runs strict type checking, unit/regression cases, and the deterministic stress sample. npm run strategies records contrasting public-information policies separately. GitHub Actions runs the check command.

Current evidence and limitations are in VERIFICATION.md. Remaining gates: complete rendered loop, guarded browser persistence, offline export, tutorial, original artwork, accessibility, browser/Windows checks, and human observations. A fast engine and solved seeds do not establish that the game is enjoyable.

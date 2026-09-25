# Cascade — staged build and test plan

The current request covers Stage 0. Later stages are specified here so that the rules, tutorial, graphics, and verification develop into one coherent game.

Each stage should leave real files, a working checkpoint, an updated handoff, and honest evidence. Do not treat a plan or generated mockup as an implemented feature. Resume from the last committed state after an interruption.

## Stage 0 — rules and architecture

Deliver versioned rules and scenario data, exact resolution order, worked arithmetic, architecture, experience plan, and this build plan to the named repository.

Exit evidence: coherent document links/data references, valid JSON, three inspected arithmetic traces, and remote revision/content verification. This stage does not claim gameplay, balance, or browser testing.

## Stage 1 — headless rules engine

Implement strict types, content validation, legal actions, availability, turn resolution, endings, public projection, and deterministic replay. Keep UI and storage outside the engine.

Port the three worked traces. Add actual boundary cases for actions not covered by the calculator. Obtain at least one winning engine trace for each authored scenario and inspect whether different situations reward different decisions.

Exit evidence: deterministic fixtures, invariant checks, every ending, and legal scenario solutions. If the engine reveals a rule contradiction, repair the versioned specification and record the reason before proceeding.

## Stage 2 — one complete playable match

Build entry, scenario selection, city/service controls, exact previews, undo, commit, consequence recap, endings, and both replay choices. Include a basic but coherent visual state for all services and control modes.

Add guarded saves and reload only after the complete match works in memory. Implement the offline export early enough to expose file-loading problems before art expansion.

Exit evidence: real-browser start → meaningful actions → complete ending → replay; reload of an open plan and terminal run; no dead controls or console errors. A failed save must not block play.

## Stage 3 — tutorial and instructions

Author exact starting fixtures for the four practice checkpoints. Use the same engine, explicit resets, and state-based completion conditions. Implement persistent How to Play and contextual reasons for disabled controls.

Exit evidence: all tutorial paths, skip, reset, reopening help, keyboard access, and transition into a normal crisis. Check that no tutorial-only arithmetic or costs have slipped in.

Observe a new player if available. Record help requested and misunderstandings. If no person is available, label comprehension untested.

## Stage 4 — original graphics, feedback, and sound

Create the consistent city asset set and integrate it with actual state-driven SVG overlays. Add short, skippable consequences and optional local audio. Inspect the rendered composition at required desktop sizes and 200% zoom.

Exit evidence: real screenshots of entry, planning, cascade, regulated recovery, loss, tutorial, and help. Check asset paths in the extracted offline package. Compare the rendered screen with the visual reference and record intentional differences.

Preserve interaction clarity. Visual effects cannot obscure numbers, capture input unexpectedly, or alter the simulation.

## Stage 5 — balance, stress, and bug fixing

### Rules and state

Test all action costs and preconditions; negative/overspent budgets; clamp boundaries 0 and 6; exact availability thresholds 2/3/4; normal/disrupted resupply; support expiry; repeated preparation/isolation/resupply; regulated-mode permanence; and terminal-state rejection.

Verify directive endpoint permissions, multi-target cancellation, full benefits removed when blocked, multiple delayed effects, effects surviving regulation, and clamp timing.

Verify one-wave dependency snapshots, multiple incoming sources, no ordering dependence, direct strain combined with deficits/recovery, loss before victory, stable-streak reset, support excluded from durable recovery, and a round-12 win.

### Replay and adversarial inputs

The same content plus command history must produce the same state and events. Forecast must equal actual commit and leave the original untouched. Repeated undo/reapply must not mint AP or supplies or reveal future orders.

Reject malformed, oversized, version-mismatched, or semantically impossible replay/save data. Exercise unavailable storage, write failures, corrupted JSON, a conflicting newer tab save, and reload during visual playback. Render imported labels only as safe text.

### Stress

Use deterministic test-generated action sequences, with test seeds recorded; the game itself has no random generator in V1. An initial budget of 1,000 short legal/rejected-command sequences across the three scenarios is enough to look for invariant failures without turning testing into a count target. Minimise and preserve any failing trace.

Stress rapid double-clicks, key-repeat commits, action/undo spam, help overlays, skip animation, background/foreground changes, and repeated new matches. Confirm only one round resolves per accepted commit revision.

Measure engine resolution and preview separately from animation. Initial targets: engine resolve below 16 ms at the 95th percentile, and response to a planning action below 100 ms on the recorded test machine. These are unmeasured design targets, not published performance claims.

### Strategy and difficulty

Compare no intervention, repair-only, isolation-heavy, Emergency-first, Grid-first, Communications-first, and mixed containment using only player-visible information. Record scenario, legal commands, terminal result, strain, round count, and where the policy made its decision.

A successful policy is not proof of an optimal strategy. A privileged solver may establish scenario solvability, but label its extra knowledge and do not use it as evidence of fair human difficulty.

If one fixed opening dominates every scenario or key actions have no useful role, revise scenario pressures and costs, rerun affected checks, and explain the change. Avoid increasing the content count to conceal a weak core loop.

### Real-browser matrix

Required: desktop Chromium, production HTTP build and extracted file:// build, at 1366×768 and 1920×1080. Check offline launch with network disabled, keyboard-only controls, focus trapping/return, 200% zoom, reduced motion, audio unlock/mute, native downloads, saved reload, endings, and replay.

Test Windows Edge directly if the environment provides it. Otherwise report that limitation and request a user smoke test later; do not rename a Linux Chromium run as a Windows result.

### Human observations

When testers are available, observe at least one first-time tutorial session and a full crisis. Measure completion time, help needed, understanding of one causal chain, whether the player can explain the danger of unchecked authority, and whether they choose another run.

Human enjoyment, replay interest, and learning remain untested until observed. Automated strategies are not substitutes.

Fix concrete failures and rerun affected checks. Broaden verification only when a change introduces a new risk or a required gate is still unmet.

## Stage 6 — package and competition materials

Bundle the checked game, instructions, source, credits, AI-tool disclosure, and verification record. Include the scenario/content versions and source commit in a build manifest.

Extract the final ZIP into a clean directory, compare its contents with the tested build, and launch the extracted file offline. Verify repository readback and any configured CI. Provide a 3–5-minute demo outline and capture real gameplay for the eventual video.

The public rules on pre-kickoff work and the user's entry status remain to be verified before claiming competition readiness. No deployment or submission occurs without authorisation.

## Priority and scope control

Essential: one complete crisis first; then all three crises, tutorial, clear help, original core graphics, recovery/ending/replay, offline packaging, and truthful verification.

After these work: optional richer sound, additional scenario variants, or comparison with a previous run.

Outside V1: live AI integration, accounts, multiplayer, backend, procedural city generation, large progression systems, complex population simulation, 3D navigation, and mobile-first controls.

A smaller finished game has a valid completion record only when its stated required checks actually pass. Record remaining defects by severity; never replace a failed gate with a polished screenshot.

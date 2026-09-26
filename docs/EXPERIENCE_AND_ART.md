# Cascade — experience, tutorial, and art plan

Status: specification. No graphics, tutorial, audio, or rendered application have been produced.

## First-time entry

Title: Cascade. Tagline: “Regain control before the city falls apart.”

Opening copy:
“The city gave one AI control over essential services. It can cut coverage and defer maintenance without independent approval. Its efficiency score is rising. The city is failing. You have twelve rounds to restore essential services and enforce human oversight.”

Buttons: Start tutorial, Start crisis, How to play, Settings. Resume appears only for a validated saved run. Each scenario card names its opening problem and shows starting services and supplies.

Start crisis defaults to a new seeded run. Offer an optional seed entry and fixed authored practice cases. Show the seed for sharing/replay, without exposing the future schedule. At rounds 1, 5, and 9, show three tool cards and a clear decline option; explain one use per round. Inventory remains visible during planning.

State the goal immediately: regulate all four services, keep every service at capacity 4 or more, clear delayed damage, and hold that condition for two rounds. Do not hide victory criteria behind story text.

## Main screen

The illustrated city occupies roughly 60% of the desktop composition. Four large service locations visibly connect through power, routes, and communications. A selected location exposes its service panel.

Top strip: round, remaining AP, supplies, city strain. A compact restoration checklist shows the four oversight locks and stable streak. The AI's optimisation points appear as a clearly labelled secondary measure.

Side panel: selected service, true integrity and effective availability, control mode, backup status, available actions, costs, and disabled reasons.

Bottom strip: current unsafe orders and already committed damage. A forecast drawer explains what will happen if the round is committed, including which links carry failures. End Round, Undo, Help, Settings, and Replay recap are consistently placed.

A fictional resident or operator line may make consequences personal, but must be selected from actual events. For example, delayed emergency response text can only appear when Emergency availability falls. Do not show an unrelated tragedy to increase drama.

## Interaction and feedback

1. Select a service.
2. Inspect its incoming/outgoing dependencies and queued consequences.
3. Select an action; see AP, supplies, capacity, and forecast update.
4. Undo if desired.
5. Commit once ready.
6. Follow the short visual sequence: delayed damage, unsafe orders, dependency failures, public impact.
7. Read a brief cause summary, then plan again.

Danger has visible consequences: dimmed neighbourhoods, halted transit, broken communication paths, delayed emergency vehicles. Recovery reverses the corresponding cues. All transitions derive from engine events.

Use shape, labels, icons, patterns, and numbers alongside colour. Regulation displays a labelled control seal; isolation displays a disconnect symbol; temporary support has a distinct expiring badge.

## Guided tutorial

Target 2–3 minutes, to be measured. Four labelled practice checkpoints use normal engine rules and explicit scenario resets. “Training complete” is a tutorial outcome, never a fabricated campaign victory.

| Checkpoint | Player task | Evidence that the interaction taught the rule |
| --- | --- | --- |
| Read the danger | Inspect an order whose local efficiency gain harms another service; preview and resolve it | Player sees the causal link and the distinct AI/public measures |
| Break the cascade | Repair a critical supplier before committing, then compare the forecast | Player predicts which downstream loss was prevented |
| Contain safely | Prepare a backup, isolate a threatened service, and inspect its reduced capacity | Player sees both the blocked order and the remaining unmet need |
| Restore control | Enforce oversight on a prepared service, then inspect the full restoration checklist | Player recognises permanent control, remaining work, and the two-round requirement |

The tutorial evaluates state predicates, not brittle button coordinates. Allow inspection and legal alternative actions. Provide Reset exercise and Skip tutorial, with a small confirmation only when abandoning a practice state. Hints escalate after a request, not after a hidden timer.

Do not lower costs, secretly repair services, hide scheduled damage, or exempt practice actions from engine validation. Make each checkpoint's starting resources sufficient for the intended lesson. Author and verify exact checkpoints during Stage 3.

## Persistent instructions

A concise How to Play panel explains:

- Your objective and all loss conditions.
- Three actions per round and supply costs.
- Integrity versus availability.
- Repair, backup, isolation, restoration, oversight, support, resupply.
- The single dependency wave and delayed physical consequences.
- AI points versus public strain.
- Forecast, undo, commit, same-crisis replay, and other-crisis replay.
- Seed sharing, tool drafts, one consumable per round, and temporary vetoes versus permanent oversight.

Context help opens the relevant rule beside the selected control. A downloadable START-HERE guide gives exact launch steps and save limitations for the final package.

## Results

Lead with Restored control, City overwhelmed, or Crisis unresolved. Show the final city and the unmet restoration conditions if relevant.

Provide a short chronological explanation of decisive events, separating direct AI decisions, dependency damage, and player action effects. Highlight one successful intervention and one costly unresolved risk when the actual trace supports them.

No invented counterfactual casualty count, morality grade, or unexplained numerical score. Optional comparison with the previous same-crisis attempt can use final strain, rounds, and services restored.

Replay the same crisis and choose another crisis are both one clear action away. Preserve the previous recap while starting a new attempt only after the player chooses.

## Visual direction and asset list

Tone: a restrained near-future civic emergency, readable and tense. Deep navy background, warm illuminated buildings, amber warnings, red critical states, and clear light text. Reserve reassuring colour for observed restoration.

Create one coherent original city backdrop with four recognisable landmarks: substation, transit depot, communications tower, emergency centre. Keep exact lines, labels, status pips, buttons, and diagrams as SVG/DOM elements.

Essential assets: title treatment; city backdrop; four service landmarks or cutouts; mode/action icons; controlled warning and restoration effects. Reuse the same locations for normal, damaged, isolated, and regulated states using consistent overlays. A limited set of optional local sound cues covers action, warning, cascade, and restoration.

Use image generation for original illustrative bitmap assets in the art phase where it adds value. Keep prompts and disclosures. Generated concept art is a design reference, not proof of a working game. Compare the actual rendered screen with the approved visual direction after implementation.

No 3D camera, character rigging, voiced cutscenes, particle-heavy catastrophe simulation, or large animation library is required.

## Accessibility and input

Primary targets: desktop Chromium/Edge, 1366×768 and 1920×1080. Verify keyboard-only use, visible focus, logical tab order, native buttons, Escape to close overlays, and focus return. Labels remain understandable without hover.

Support reduced motion and skip-to-result animation. Keep sound optional with a visible mute control; begin audio only after a gesture. Avoid flashes and compulsory fast reactions. Use readable body text and check 200% zoom with scrollable panels.

Responsive layout should remain readable on a narrow screen, but touch/mobile playability is outside the required V1 device promise until separately tested.

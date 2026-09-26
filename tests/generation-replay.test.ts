import assert from "node:assert/strict";
import test from "node:test";
import { SCENARIOS } from "../src/content/catalog.ts";
import { legalOperations } from "../src/domain/actions.ts";
import { applyCommand, createAuthoredRun, createRun, currentOffer } from "../src/domain/engine.ts";
import { generateRun, checkWitness, WITNESSES } from "../src/domain/generate.ts";
import { randomStream, normalizeSeed } from "../src/domain/random.ts";
import { projectForPlayer } from "../src/domain/project.ts";
import { exportReplay, importReplay, MAX_REPLAY_BYTES } from "../src/domain/replay.ts";
import { SERVICES, TOOLS } from "../src/domain/types.ts";
import { fingerprint } from "../src/domain/validate.ts";
import { fixture, playPlans, send } from "./helpers.ts";

for (const scenario of SCENARIOS) {
  test("engine solution: " + scenario.id, () => {
    const state = createAuthoredRun(scenario.id);
    const result = playPlans(state, WITNESSES.find(w => w.id === scenario.id)!.plans);
    assert.equal(result.state.core.ending?.outcome, "win");
    const restored = importReplay(exportReplay(result.state));
    assert.equal(restored.ok, true);
    if (restored.ok) assert.deepEqual(restored.state, result.state);
    assert.equal(applyCommand(result.state, { type: "commit_round", expectedRevision: result.state.revision }).ok, false);
  });
}
test("seed normalization and independent streams are reproducible", () => {
  assert.equal(normalizeSeed("  grid-17 "), "GRID-17");
  for (const input of ["", " ", "a".repeat(49), "城市", "<script>", null, 42]) assert.throws(() => normalizeSeed(input));
  const a = randomStream("same"), b = randomStream("same");
  assert.deepEqual(Array.from({ length: 40 }, () => a.int(100)), Array.from({ length: 40 }, () => b.int(100)));
  assert.throws(() => a.int(0));
  assert.deepEqual(generateRun(" grid-17 "), generateRun("GRID-17"));
  assert.notEqual(fingerprint(generateRun("GRID-18").state.definition), fingerprint(generateRun("GRID-17").state.definition));
  assert.equal(fingerprint(generateRun("CASCADE").state.definition), "4e7074c9ae94694a");
  assert.equal(fingerprint(generateRun("GRID-17").state.definition), "da22f9b11989f7bf");
});
test("generated runs have engine-verified tool-free recovery and bounded attempts", () => {
  const setups = new Set<string>();
  const openings = new Set<string>();
  for (let i = 0; i < 100; i++) {
    const result = generateRun("GEN-" + i);
    const solved = checkWitness(result.state.definition, result.certificate.plans);
    assert.equal(solved?.core.ending?.outcome, "win", "GEN-" + i);
    assert.equal(solved!.core.round, result.certificate.winRound);
    assert.ok(result.diagnostics.attempts <= 24);
    assert.ok(result.state.definition.scenario.rounds.every(r => r.length <= 2));
    assert.equal(result.state.definition.offers.length, 3);
    for (const offer of result.state.definition.offers) assert.equal(new Set(offer).size, 3);
    setups.add(fingerprint(result.state.definition.scenario.initial));
    openings.add(JSON.stringify(result.state.definition.scenario.rounds.slice(0, 4)));
  }
  assert.ok(setups.size > 60, "meaningful starting-state variation");
  assert.ok(openings.size > 20, "meaningful threat-order variation");
});
test("a seed that exhausts generation uses the verified fallback and retains its draft", () => {
  const generated = generateRun("STRESS-336");
  assert.equal(generated.diagnostics.fallback, true);
  assert.equal(generated.diagnostics.attempts, 24);
  assert.equal(checkWitness(generated.state.definition, generated.certificate.plans)?.core.ending?.outcome, "win");
  assert.equal(generated.state.core.phase, "draft");
  assert.equal(currentOffer(generated.state).length, 3);
});
test("draft choice is mandatory or explicitly declined, cannot reroll, and respects round timing", () => {
  let s = generateRun("DRAFT").state;
  const offers = structuredClone(s.definition.offers);
  assert.equal(applyCommand(s, { type: "commit_round", expectedRevision: 0 }).ok, false);
  assert.equal(applyCommand(s, { type: "choose_tool", tool: TOOLS.find(t => !currentOffer(s).includes(t)), expectedRevision: 0 }).ok, false);
  s = send(s, { type: "choose_tool", tool: currentOffer(s)[0]! }).state;
  assert.equal(s.core.ap, 3); assert.equal(s.core.inventory.length, 1);
  assert.equal(applyCommand(s, { type: "choose_tool", tool: null, expectedRevision: s.revision }).ok, false);
  assert.equal(applyCommand(s, { type: "undo", expectedRevision: s.revision }).ok, false);
  // Purpose-built harmless fixture checks reaching both later draft boundaries.
  const d = structuredClone(s.definition);
  d.scenario.rounds = Array.from({ length: 12 }, () => []);
  for (const id of SERVICES) d.scenario.initial.integrity[id] = 4;
  d.scenario.initial.strain = 0;
  s = createRun(d);
  s = send(s, { type: "choose_tool", tool: null }).state;
  for (let round = 1; round <= 8; round++) {
    if (round === 5) {
      assert.equal(s.core.phase, "draft"); assert.deepEqual(currentOffer(s), offers[1]);
      s = send(s, { type: "choose_tool", tool: null }).state;
    }
    s = send(s, { type: "commit_round" }).state;
  }
  assert.equal(s.core.round, 9); assert.equal(s.core.phase, "draft"); assert.deepEqual(currentOffer(s), offers[2]);
});
test("terminal resolution has priority over a scheduled draft", () => {
  let s = generateRun("DRAFT").state;
  s = send(s, { type: "choose_tool", tool: null }).state;
  s.core.round = 8; s.core.stableStreak = 1; s.core.pending = []; s.core.strain = 0;
  for (const id of SERVICES) { s.core.services[id].mode = "regulated"; s.core.services[id].integrity = 4; }
  s = send(s, { type: "commit_round" }).state;
  assert.equal(s.core.phase, "terminal"); assert.equal(s.core.ending?.outcome, "win");
  assert.deepEqual(currentOffer(s), []);
});
test("each emergency tool is consumable, costs no AP, and can be undone before commitment", () => {
  for (const tool of TOOLS) {
    let s = fixture();
    s.core.inventory = [tool]; s.core.strain = 5; s.roundStart = structuredClone(s.core);
    const original = structuredClone(s.core);
    const operation = tool === "supply_drop" || tool === "civic_relief"
      ? { type: "use_tool" as const, tool }
      : { type: "use_tool" as const, tool, target: "grid" as const };
    s = send(s, operation).state;
    assert.equal(s.core.ap, 3); assert.equal(s.core.inventory.length, 0); assert.equal(s.core.toolUsed, true);
    switch (tool) {
      case "field_patch": assert.equal(s.core.services.grid.integrity, 6); break;
      case "mobile_backup": assert.equal(s.core.services.grid.backup, true); break;
      case "supply_drop": assert.equal(s.core.supplies, 14); break;
      case "civic_relief": assert.equal(s.core.strain, 2); break;
      case "surge_support": assert.equal(s.core.services.grid.support, 2); break;
      case "authority_lock": assert.equal(s.core.services.grid.authorityHeld, true); break;
    }
    assert.equal(applyCommand(s, { ...operation, expectedRevision: s.revision }).ok, false);
    s = send(s, { type: "undo" }).state;
    assert.deepEqual(s.core, original);
  }
});
test("independent veto blocks new orders, not due damage, and expires next round", () => {
  let s = fixture();
  s.core.inventory = ["authority_lock"];
  s.core.services.grid.integrity = 6;
  s.core.pending = [{ id: "committed", source: "G2", originatingRound: 0, dueRound: 1, target: "grid", delta: -3 }];
  s = send(s, { type: "use_tool", tool: "authority_lock", target: "grid" }).state;
  const result = send(s, { type: "commit_round" });
  assert.equal(result.resolution!.end.services.grid.integrity, 3);
  assert.equal(result.state.core.pending.length, 0);
  assert.equal(result.state.core.points, 0);
  assert.equal(result.state.core.services.grid.mode, "autonomous");
  assert.equal(result.state.core.services.grid.authorityHeld, false);
});
test("one tool per round even with multiple copies; declines do not grant tools", () => {
  let s = fixture(); s.core.inventory = ["supply_drop", "supply_drop"];
  s = send(s, { type: "use_tool", tool: "supply_drop" }).state;
  assert.equal(s.core.inventory.length, 1);
  assert.equal(applyCommand(s, { type: "use_tool", tool: "supply_drop", expectedRevision: s.revision }).ok, false);
  s = generateRun("DECLINE").state;
  s = send(s, { type: "choose_tool", tool: null }).state;
  assert.equal(s.core.inventory.length, 0);
});
test("public projection and forecasts are invariant to unrevealed orders and tool offers", () => {
  const s = fixture();
  const changed = structuredClone(s);
  changed.definition.scenario.rounds[1] = ["G1", "T2"];
  changed.definition.scenario.rounds[11] = ["G2", "T1"];
  assert.deepEqual(projectForPlayer(s), projectForPlayer(changed));
  let seeded = generateRun("BOUNDARY").state;
  seeded = send(seeded, { type: "choose_tool", tool: null }).state;
  const altered = structuredClone(seeded);
  altered.definition.offers[1] = ["civic_relief", "supply_drop", "field_patch"];
  assert.deepEqual(projectForPlayer(seeded), projectForPlayer(altered));
  const publicView = projectForPlayer(s);
  publicView.core.supplies = 999;
  assert.equal(s.core.supplies, 10);
  assert.equal("definition" in publicView, false);
});
test("replay restores pending drafts, open plans, used tools, and monotonic revisions after undo", () => {
  let s = generateRun("ROUNDTRIP").state;
  const roundtrip = () => {
    const imported = importReplay(exportReplay(s)); assert.equal(imported.ok, true);
    if (imported.ok) assert.deepEqual(imported.state, s);
  };
  roundtrip();
  const tool = currentOffer(s).find(t => t !== "civic_relief" || s.core.strain > 0)!;
  s = send(s, { type: "choose_tool", tool }).state;
  s = send(s, { type: "act", action: "resupply" }).state;
  roundtrip();
  s = send(s, { type: "undo" }).state;
  roundtrip();
  const useTool = legalOperations(s.core).find(op => op.type === "use_tool")!;
  s = send(s, useTool).state;
  roundtrip();
  s = send(s, { type: "undo" }).state;
  roundtrip();
  const solved = playPlans(s, generateRun("ROUNDTRIP").certificate.plans).state;
  const imported = importReplay(exportReplay(solved));
  assert.equal(imported.ok, true);
  if (imported.ok) assert.deepEqual(imported.state, solved);
});
test("replay rejects oversized, deeply nested, incompatible, forged, and illegal inputs", () => {
  const original = exportReplay(fixture());
  const bad: unknown[] = [null, "", "{", "x".repeat(MAX_REPLAY_BYTES + 1), "[".repeat(30) + "0" + "]".repeat(30)];
  const edit = (fn: (data: Record<string, any>) => void) => { // Deliberately hostile JSON shapes.
    const data = JSON.parse(original) as Record<string, any>; fn(data); bad.push(JSON.stringify(data));
  };
  edit(d => { d.contentHash = "wrong"; });
  edit(d => { d.core = { supplies: 999 }; });
  edit(d => { d.definition.scenario.initial.supplies = 20; d.definitionHash = fingerprint(d.definition); });
  edit(d => { d.definition.descriptor.id = "unknown"; });
  edit(d => { d.history = Array.from({ length: 13 }, (_, i) => ({ round: i + 1, operations: [] })); });
  edit(d => { d.openPlan = [{ type: "act", action: "enforce_oversight", target: "grid" }]; d.revision = 1; });
  edit(d => { d.openPlan = [{ type: "act", action: "resupply" }, { type: "act", action: "resupply" }]; d.revision = 2; });
  edit(d => { d.choices = [{ round: 1, tool: "supply_drop" }]; });
  edit(d => { d.history = [{ round: 2, operations: [] }]; });
  edit(d => { d.openPlan = [{ type: "act", action: "repair", target: "grid", supplies: 100 }]; });
  for (const data of bad) assert.equal(importReplay(data).ok, false);
  assert.equal(importReplay(original).ok, true);
});

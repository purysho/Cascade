import assert from "node:assert/strict";
import test from "node:test";
import { RULES } from "../src/content/catalog.ts";
import { availability, capacities } from "../src/domain/availability.ts";
import { applyCommand, forecastCommit } from "../src/domain/engine.ts";
import { resolveRound } from "../src/domain/resolve.ts";
import { deepFreeze, validateRules, validateScenario } from "../src/domain/validate.ts";
import { SERVICES } from "../src/domain/types.ts";
import { fixture, send } from "./helpers.ts";

test("availability: isolation caps, support, dead services, and unboosted recovery", () => {
  const s = fixture().core.services.grid;
  s.integrity = 6; s.mode = "isolated";
  assert.equal(availability(s), 1);
  s.backup = true;
  assert.equal(availability(s), 3);
  s.support = 1;
  assert.equal(availability(s), 4);
  assert.equal(availability(s, true), 3);
  s.integrity = 2;
  assert.equal(availability(s), 3);
  s.integrity = 0;
  assert.equal(availability(s), 0);
  s.integrity = 6; s.mode = "regulated"; s.support = 2;
  assert.equal(availability(s), 6);
});
test("actions charge exact costs, clamp repairs, and reject overspending without mutation", () => {
  let s = fixture();
  s.core.services.grid.integrity = 5;
  s = send(s, { type: "act", action: "repair", target: "grid" }).state;
  assert.equal(s.core.services.grid.integrity, 6);
  assert.equal(s.core.ap, 2); assert.equal(s.core.supplies, 9);
  const before = structuredClone(s);
  const result = applyCommand(s, { type: "act", action: "repair", target: "grid", expectedRevision: s.revision });
  assert.equal(result.ok, false); assert.equal(result.state, s); assert.deepEqual(s, before);
  s = send(s, { type: "act", action: "prepare_backup", target: "grid" }).state;
  assert.equal(s.core.ap, 1); assert.equal(s.core.supplies, 7);
  assert.equal(applyCommand(s, { type: "act", action: "enforce_oversight", target: "grid", expectedRevision: s.revision }).ok, false);
  s.core.ap = 3;
  s = send(s, { type: "act", action: "enforce_oversight", target: "grid" }).state;
  assert.equal(s.core.ap, 1); assert.equal(s.core.supplies, 5); assert.equal(s.core.services.grid.mode, "regulated");
  for (const action of ["isolate", "restore_automation", "enforce_oversight", "prepare_backup"]) {
    assert.equal(applyCommand(s, { type: "act", action, target: "grid", expectedRevision: s.revision }).ok, false);
  }
});
test("regulation requires a backup, integrity 3, and adequate supplies", () => {
  const s = fixture();
  const act = () => applyCommand(s, { type: "act", action: "enforce_oversight", target: "grid", expectedRevision: 0 });
  assert.equal(act().ok, false);
  s.core.services.grid.backup = true; s.core.services.grid.integrity = 2;
  assert.equal(act().ok, false);
  s.core.services.grid.integrity = 3; s.core.supplies = 1;
  assert.equal(act().ok, false);
  s.core.supplies = 2;
  assert.equal(act().ok, true);
});
test("isolation and restoration charge AP and never remove the manual backup", () => {
  let s = fixture();
  s.core.services.grid.backup = true;
  s = send(s, { type: "act", action: "isolate", target: "grid" }).state;
  assert.equal(s.core.ap, 2); assert.equal(s.core.supplies, 10);
  assert.equal(applyCommand(s, { type: "act", action: "isolate", target: "grid", expectedRevision: s.revision }).ok, false);
  s = send(s, { type: "act", action: "restore_automation", target: "grid" }).state;
  assert.equal(s.core.ap, 1); assert.equal(s.core.services.grid.mode, "autonomous"); assert.equal(s.core.services.grid.backup, true);
});
test("resupply thresholds, one use, support, and supply cap", () => {
  let s = fixture();
  s.core.supplies = 19;
  s = send(s, { type: "act", action: "resupply" }).state;
  assert.equal(s.core.supplies, 20);
  assert.equal(applyCommand(s, { type: "act", action: "resupply", expectedRevision: s.revision }).ok, false);
  s = fixture(); s.core.services.transit.integrity = 3;
  assert.equal(send(s, { type: "act", action: "resupply" }).state.core.supplies, 11);
  s = send(s, { type: "act", action: "emergency_support", target: "transit" }).state;
  s = send(s, { type: "act", action: "resupply" }).state;
  assert.equal(s.core.supplies, 12);
  s = fixture(); s.core.services.comms.integrity = 2;
  assert.equal(send(s, { type: "act", action: "resupply" }).state.core.supplies, 11);
  s.core.supplies = 20;
  assert.equal(applyCommand(s, { type: "act", action: "resupply", expectedRevision: 0 }).ok, false);
});
test("support is temporary, cannot revive outages, and cannot stack", () => {
  let s = fixture();
  s = send(s, { type: "act", action: "emergency_support", target: "grid" }).state;
  assert.equal(s.core.ap, 2); assert.equal(s.core.supplies, 9);
  assert.equal(applyCommand(s, { type: "act", action: "emergency_support", target: "grid", expectedRevision: s.revision }).ok, false);
  const commit = send(s, { type: "commit_round" });
  assert.equal(commit.resolution!.end.services.grid.support, 1);
  assert.equal(commit.state.core.services.grid.support, 0);
  s = fixture(); s.core.services.grid.integrity = 0;
  assert.equal(applyCommand(s, { type: "act", action: "emergency_support", target: "grid", expectedRevision: 0 }).ok, false);
});
test("every permission endpoint blocks the complete order, benefit, points and delayed damage", () => {
  for (const directive of RULES.directives) for (const endpoint of directive.requiresAutonomous) {
    const core = fixture().core;
    for (const id of SERVICES) core.services[id].integrity = 4;
    core.services[endpoint].mode = "regulated";
    const r = resolveRound(core, [directive.id]);
    assert.equal(r.end.points, 0); assert.equal(r.end.pending.length, 0);
    assert.deepEqual(capacities(r.end), { grid: 4, transit: 4, comms: 4, emergency: 4 });
    assert.equal(r.events.filter(e => e.kind === "order_blocked").length, 1);
  }
});
test("delayed maintenance damage survives later regulation and records its source", () => {
  const core = fixture().core;
  core.services.grid.integrity = 6;
  const first = resolveRound(core, ["G2"]);
  assert.equal(first.end.services.grid.integrity, 6);
  const next = structuredClone(first.end);
  next.round = 2; next.services.grid.mode = "regulated";
  const second = resolveRound(next, ["G2"]);
  assert.equal(second.end.services.grid.integrity, 3);
  assert.equal(second.end.pending.length, 0); assert.equal(second.end.points, 6);
  assert.equal(second.events[0]!.kind, "effect_applied");
  assert.match(second.events[0]!.detail!, /committed in round 1/);
});
test("due damage aggregates before clamping; order effects clamp separately in listed order", () => {
  const core = fixture().core;
  core.services.grid.integrity = 2;
  core.pending = [1, 2].map(n => ({ id: "p" + n, source: "G2", originatingRound: 0, dueRound: 1, target: "grid", delta: -3 }));
  const r = resolveRound(core, ["G2"]);
  assert.equal(r.end.services.grid.integrity, 2); // 2 - 6 -> 0, then +2.
  const clamp = fixture().core;
  clamp.services.transit.integrity = 5; clamp.services.emergency.integrity = 6;
  assert.equal(resolveRound(clamp, ["T2", "E2"]).end.services.transit.integrity, 4);
  assert.equal(resolveRound(clamp, ["E2", "T2"]).end.services.transit.integrity, 5);
});
test("dependency failures use one simultaneous snapshot, even after a target becomes critical", () => {
  const core = fixture().core;
  for (const [id, value] of Object.entries({ grid: 2, transit: 3, comms: 3, emergency: 6 })) core.services[id as typeof SERVICES[number]].integrity = value;
  const r = resolveRound(core, []);
  assert.deepEqual(capacities(r.end), { grid: 2, transit: 2, comms: 2, emergency: 5 });
  assert.equal(r.events.filter(e => e.kind === "dependency_failure").length, 3);
  const reordered = structuredClone(core);
  reordered.services = Object.fromEntries(Object.entries(core.services).reverse()) as typeof core.services;
  assert.deepEqual(resolveRound(reordered, []), r);
});
test("multiple failing suppliers accumulate; support at threshold 3 blocks outgoing failure", () => {
  const core = fixture().core;
  for (const id of ["grid", "transit", "comms"] as const) core.services[id].integrity = 2;
  core.services.emergency.integrity = 6;
  const r = resolveRound(core, []);
  assert.deepEqual(capacities(r.end), { grid: 2, transit: 0, comms: 1, emergency: 3 });
  core.services.grid.support = 1;
  const supported = resolveRound(core, []);
  assert.equal(supported.end.services.comms.integrity, 2);
  assert.equal(supported.events.filter(e => e.kind === "dependency_failure").length, 3);
});
test("collapse has priority; durable recovery excludes support and pending harm; round 12 can win", () => {
  const core = fixture().core;
  for (const id of SERVICES) { core.services[id].integrity = 4; core.services[id].mode = "regulated"; }
  core.stableStreak = 1; core.strain = 18;
  assert.equal(resolveRound(core, []).end.ending?.outcome, "collapse");
  core.strain = 0; core.round = 12;
  assert.equal(resolveRound(core, []).end.ending?.outcome, "win");
  core.stableStreak = 0;
  assert.equal(resolveRound(core, []).end.ending?.outcome, "deadline");
  core.round = 4; core.stableStreak = 1;
  core.services.grid.integrity = 3; core.services.grid.support = 1;
  assert.equal(resolveRound(core, []).end.stableStreak, 0);
  core.services.grid.integrity = 4; core.services.grid.support = 0;
  core.pending = [{ id: "p", source: "G2", originatingRound: 4, dueRound: 5, target: "grid", delta: -3 }];
  assert.equal(resolveRound(core, []).end.stableStreak, 0);
});
test("forecast equals commit, leaves a frozen source unchanged, and stale double commit is rejected", () => {
  const s = deepFreeze(fixture());
  const before = JSON.stringify(s), forecast = forecastCommit(s);
  const result = send(s, { type: "commit_round" });
  assert.deepEqual(result.resolution, forecast);
  assert.equal(JSON.stringify(s), before);
  const repeated = applyCommand(result.state, { type: "commit_round", expectedRevision: s.revision });
  assert.equal(repeated.ok, false); assert.equal(repeated.state, result.state);
});
test("undo rebuilds the plan, increases revision, and cannot mint resources", () => {
  let s = fixture();
  for (let i = 0; i < 30; i++) {
    s = send(s, { type: "act", action: "resupply" }).state;
    s = send(s, { type: "undo" }).state;
    assert.deepEqual(s.core, fixture().core);
  }
  assert.equal(s.revision, 60);
  assert.equal(s.history.length, 0); assert.equal(s.openPlan.length, 0);
  assert.equal(applyCommand(s, { type: "undo", expectedRevision: s.revision }).ok, false);
});
test("malformed commands and invalid content are rejected at runtime", () => {
  const s = fixture();
  for (const command of [null, [], {}, { type: "act", action: "repair", target: "__proto__", expectedRevision: 0 },
    { type: "commit_round", expectedRevision: NaN }, { type: "commit_round", expectedRevision: -1 },
    { type: "commit_round", expectedRevision: 0, bonus: 5 }]) assert.equal(applyCommand(s, command).ok, false);
  const scenario = structuredClone(s.definition.scenario);
  scenario.rounds[0] = ["G2", "G2"];
  assert.throws(() => validateScenario(scenario));
  scenario.rounds[0] = []; scenario.initial.integrity.grid = -1;
  assert.throws(() => validateScenario(scenario));
  const rules = structuredClone(RULES);
  rules.directives[0]!.requiresAutonomous = ["grid", "grid"];
  assert.throws(() => validateRules(rules));
});
test("backed isolation can avert a specific current crisis without certifying recovery", () => {
  const core = fixture().core;
  for (const id of SERVICES) core.services[id].integrity = 4;
  core.strain = 14; core.services.emergency.backup = true;
  assert.equal(resolveRound(core, ["E1", "G1"]).end.ending?.outcome, "collapse");
  core.services.emergency.mode = "isolated";
  const r = resolveRound(core, ["E1", "G1"]);
  assert.equal(r.end.ending, null); assert.equal(r.end.strain, 15); assert.equal(r.end.stableStreak, 0);
});

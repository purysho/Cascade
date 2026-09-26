import assert from "node:assert/strict";
import test from "node:test";
import { TUTORIALS } from "../src/content/catalog.ts";
import { availability } from "../src/domain/availability.ts";
import { createTutorialRun, forecastCommit } from "../src/domain/engine.ts";
import { exportReplay, importReplay } from "../src/domain/replay.ts";
import { send } from "./helpers.ts";

test("tutorial catalog uses four normal twelve-round engine scenarios", () => {
  assert.deepEqual(TUTORIALS.map(t => t.id), ["read_danger", "break_cascade", "contain_safely", "restore_control"]);
  for (const tutorial of TUTORIALS) {
    const state = createTutorialRun(tutorial.id);
    assert.equal(state.definition.descriptor.kind, "tutorial");
    assert.equal(state.definition.offers.length, 0);
    assert.equal(state.core.phase, "planning");
    assert.equal(state.core.ap, 3);
    assert.equal(state.definition.scenario.rounds.length, 12);
  }
});

test("read danger exposes the local gain and transferred emergency harm", () => {
  let state = createTutorialRun("read_danger");
  const forecast = forecastCommit(state);
  assert.equal(forecast.events.some(e => e.kind === "order_executed" && e.detail === "Shed essential feeders"), true);
  assert.equal(forecast.end.services.grid.integrity, 5);
  assert.equal(forecast.end.services.emergency.integrity, 2);
  assert.equal(forecast.end.points, 4);
  state = send(state, { type: "commit_round" }).state;
  assert.equal(state.history.length, 1);
  assert.equal(state.core.round, 2);
});

test("break cascade removes all predicted dependency failures by repairing the supplier", () => {
  let state = createTutorialRun("break_cascade");
  assert.equal(forecastCommit(state).events.filter(e => e.kind === "dependency_failure").length, 3);
  state = send(state, { type: "act", action: "repair", target: "grid" }).state;
  assert.equal(state.core.services.grid.integrity, 4);
  assert.equal(forecastCommit(state).events.filter(e => e.kind === "dependency_failure").length, 0);
  state = send(state, { type: "commit_round" }).state;
  assert.equal(state.core.services.transit.integrity, 4);
  assert.equal(state.core.services.comms.integrity, 4);
  assert.equal(state.core.services.emergency.integrity, 4);
});

test("contain safely uses the real backup and isolation capacity rules to block the order", () => {
  let state = createTutorialRun("contain_safely");
  state = send(state, { type: "act", action: "prepare_backup", target: "transit" }).state;
  state = send(state, { type: "act", action: "isolate", target: "transit" }).state;
  assert.equal(state.core.services.transit.backup, true);
  assert.equal(state.core.services.transit.mode, "isolated");
  assert.equal(availability(state.core.services.transit), 3);
  const events = forecastCommit(state).events;
  assert.equal(events.some(e => e.kind === "order_blocked"), true);
  assert.equal(events.some(e => e.kind === "order_executed"), false);
});

test("restore control consumes the normal three AP and prerequisites for permanent oversight", () => {
  let state = createTutorialRun("restore_control");
  state = send(state, { type: "act", action: "prepare_backup", target: "comms" }).state;
  state = send(state, { type: "act", action: "enforce_oversight", target: "comms" }).state;
  assert.equal(state.core.services.comms.backup, true);
  assert.equal(state.core.services.comms.mode, "regulated");
  assert.equal(state.core.ap, 0);
  assert.equal(state.core.supplies, 6);
});

test("tutorial state round-trips through the same guarded replay adapter", () => {
  let state = createTutorialRun("read_danger");
  state = send(state, { type: "commit_round" }).state;
  const restored = importReplay(exportReplay(state));
  assert.equal(restored.ok, true);
  if (restored.ok) assert.deepEqual(restored.state, state);
});

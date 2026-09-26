import assert from "node:assert/strict";
import test from "node:test";
import traces from "../design/worked-traces-v0.1.json" with { type: "json" };
import { createAuthoredRun } from "../src/domain/engine.ts";
import { capacities } from "../src/domain/availability.ts";
import { SERVICES } from "../src/domain/types.ts";
import type { Operation } from "../src/domain/types.ts";
import { playPlans } from "./helpers.ts";

for (const golden of traces.cases) {
  test("original arithmetic: " + golden.name, () => {
    const plans = golden.plans.map(plan => plan.map(op => ({ type: "act", ...op }) as Operation));
    const { ends } = playPlans(createAuthoredRun(golden.scenarioId), plans);
    assert.deepEqual(ends.map(({ end }) => ({
      round: end.round, integrity: SERVICES.map(id => end.services[id].integrity),
      availability: SERVICES.map(id => capacities(end)[id]),
      supplies: end.supplies, strain: end.strain, points: end.points, stableStreak: end.stableStreak,
      status: end.ending?.outcome === "win" ? "WIN" : end.ending ? "LOSS" : "ACTIVE"
    })), golden.expectedRoundEnds);
  });
}

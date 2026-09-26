import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { CONTENT_HASH, SCENARIOS } from "../src/content/catalog.ts";
import { legalOperations } from "../src/domain/actions.ts";
import { capacities } from "../src/domain/availability.ts";
import { applyCommand, createAuthoredRun, currentOffer, forecastCommit } from "../src/domain/engine.ts";
import { checkWitness, generateRun } from "../src/domain/generate.ts";
import { randomStream } from "../src/domain/random.ts";
import { exportReplay, importReplay } from "../src/domain/replay.ts";
import { fingerprint } from "../src/domain/validate.ts";
import { SERVICES } from "../src/domain/types.ts";
import type { GameState } from "../src/domain/types.ts";

const COUNT = 1000;
const start = performance.now();
const timings: number[] = [], generationTimes: number[] = [], attemptCounts: number[] = [];
const initialStates = new Set<string>(), openingSchedules = new Set<string>();
const certificateTemplates: Record<string, number> = {}, outcomes: Record<string, number> = {};
const fallbackSeeds: string[] = [];
let fallbacks = 0, acceptedCommands = 0, rejectedCommands = 0, commits = 0, replayChecks = 0;
function invariants(s: GameState) {
  const c = s.core;
  assert.ok(Number.isInteger(c.round) && c.round >= 1 && c.round <= 12);
  assert.ok(Number.isInteger(c.ap) && c.ap >= 0 && c.ap <= 3);
  assert.ok(Number.isInteger(c.supplies) && c.supplies >= 0 && c.supplies <= 20);
  assert.ok(Number.isInteger(c.strain) && c.strain >= 0);
  assert.ok(c.points >= 0 && c.points <= 144);
  assert.ok(s.openPlan.length <= 4 && s.history.length <= 12 && s.choices.length <= 3 && c.inventory.length <= 3 && c.pending.length <= 2);
  assert.equal(c.phase === "terminal", c.ending !== null);
  for (const id of SERVICES) {
    const svc = c.services[id];
    assert.ok(Number.isInteger(svc.integrity) && svc.integrity >= 0 && svc.integrity <= 6);
    assert.ok(Number.isInteger(svc.support) && svc.support >= 0 && svc.support <= 2);
    assert.ok(capacities(c)[id] >= 0 && capacities(c)[id] <= 6);
    if (svc.mode === "regulated") assert.equal(svc.backup, true);
  }
  for (const p of c.pending) assert.ok(p.dueRound === p.originatingRound + 1 && p.delta < 0);
  if (c.ending?.outcome === "win") {
    assert.equal(c.stableStreak, 2); assert.equal(c.pending.length, 0);
    for (const id of SERVICES) { assert.equal(c.services[id].mode, "regulated"); assert.ok(capacities(c, true)[id] >= 4); }
  }
}
for (let i = 0; i < COUNT; i++) {
  const seed = "STRESS-" + i, t = performance.now(), generated = generateRun(seed);
  generationTimes.push(performance.now() - t); attemptCounts.push(generated.diagnostics.attempts);
  assert.deepEqual(generated.state.definition, generateRun(seed).state.definition, seed + " determinism");
  const witness = checkWitness(generated.state.definition, generated.certificate.plans);
  assert.equal(witness?.core.ending?.outcome, "win", seed + " certificate");
  invariants(witness!);
  if (generated.diagnostics.fallback) { fallbacks++; fallbackSeeds.push(seed); }
  certificateTemplates[generated.certificate.template] = (certificateTemplates[generated.certificate.template] ?? 0) + 1;
  initialStates.add(fingerprint(generated.state.definition.scenario.initial));
  openingSchedules.add(JSON.stringify(generated.state.definition.scenario.rounds.slice(0, 4)));
  const rng = randomStream("commands:" + seed);
  let state = i % 2 === 0 ? generated.state : createAuthoredRun(SCENARIOS[i % SCENARIOS.length]!.id);
  for (let step = 0; step < 150 && state.core.phase !== "terminal"; step++) {
    invariants(state);
    const before = JSON.stringify(state);
    const invalid = applyCommand(state, { type: "act", action: "repair", target: "missing", expectedRevision: state.revision });
    assert.equal(invalid.ok, false); assert.equal(invalid.state, state); rejectedCommands++;
    let command: Record<string, unknown>;
    if (state.core.phase === "draft") {
      const offer = currentOffer(state);
      command = { type: "choose_tool", tool: rng.int(4) === 0 ? null : offer[rng.int(offer.length)] };
    } else {
      const operations = legalOperations(state.core);
      if (state.openPlan.length && rng.int(8) === 0) command = { type: "undo" };
      else if (operations.length && rng.int(4) !== 0) command = operations[rng.int(operations.length)]!;
      else command = { type: "commit_round" };
    }
    let forecast;
    if (command.type === "commit_round") {
      const tick = performance.now(); forecast = forecastCommit(state); timings.push(performance.now() - tick);
    }
    const result = applyCommand(state, { ...command, expectedRevision: state.revision });
    assert.equal(result.ok, true, seed + " step " + step);
    assert.equal(JSON.stringify(state), before, "input state mutated");
    if (!result.ok) throw new Error("Unreachable");
    acceptedCommands++;
    if (forecast) {
      assert.deepEqual(result.resolution, forecast); commits++;
      for (const id of SERVICES) if (state.core.services[id].mode === "regulated") assert.equal(result.state.core.services[id].mode, "regulated");
    }
    assert.equal(applyCommand(result.state, { ...command, expectedRevision: state.revision }).ok, false); rejectedCommands++;
    state = result.state;
  }
  invariants(state);
  assert.equal(state.core.phase, "terminal", seed + " finite match");
  outcomes[state.core.ending!.outcome] = (outcomes[state.core.ending!.outcome] ?? 0) + 1;
  const restored = importReplay(exportReplay(state));
  assert.equal(restored.ok, true);
  if (restored.ok) assert.deepEqual(restored.state, state);
  replayChecks++;
}
const percentile = (xs: number[], p: number) => Number([...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))]!.toFixed(3));
const report = {
  stage: "headless engine", contentHash: CONTENT_HASH, node: process.version, platform: process.platform,
  generation: { seedRange: "STRESS-0 through STRESS-999", checked: COUNT, deterministic: COUNT, verifiedWinningCertificates: COUNT,
    distinctInitialStates: initialStates.size, distinctOpeningSchedules: openingSchedules.size, fallbacks, fallbackSeeds,
    meanAttempts: Number((attemptCounts.reduce((a, b) => a + b, 0) / COUNT).toFixed(3)), maxAttempts: Math.max(...attemptCounts),
    certificateTemplates, p95GenerationMs: percentile(generationTimes, 0.95) },
  randomPlay: { sessions: COUNT, acceptedCommands, rejectedCommands, commits, replayChecks, outcomes },
  p95ForecastMs: percentile(timings, 0.95),
  elapsedMs: Math.round(performance.now() - start),
  limitations: ["Finite deterministic sample; not exhaustive.", "Recovery certificates use privileged scenario knowledge.",
    "Timing measured in this Linux container, not the user's browser.", "No rendered UI, storage adapter or human playtest."]
};
mkdirSync("verification", { recursive: true });
writeFileSync("verification/engine-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));

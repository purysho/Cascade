// Development-only bounded beam search. Uses the complete scenario while exploring
// branches; its solutions prove existence, not player discoverability or fairness.
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { SCENARIOS } from "../src/content/catalog.ts";
import { createAuthoredRun } from "../src/domain/engine.ts";
import { executeOperation, legalOperations } from "../src/domain/actions.ts";
import { resolveRound } from "../src/domain/resolve.ts";
import { capacities } from "../src/domain/availability.ts";
import { SERVICES } from "../src/domain/types.ts";
import type { Core, Operation, Scenario } from "../src/domain/types.ts";

interface Node { core: Core; plans: Operation[][] }
function score(core: Core): number {
  if (core.ending?.outcome === "win") return 10000 - core.round;
  if (core.ending) return -10000;
  const cap = capacities(core);
  let n = -core.strain * 7 + core.supplies * 1.1 + core.stableStreak * 50;
  for (const id of SERVICES) {
    const s = core.services[id];
    n += (s.mode === "regulated" ? 32 : 0) + (s.backup ? 7 : 0) + Math.min(4, cap[id]) * 5 + Math.max(0, s.integrity - 4);
    if (cap[id] < 3) n -= 10;
  }
  n -= core.pending.reduce((n, p) => n - p.delta * 3, 0);
  return n;
}
function key(core: Core) {
  return JSON.stringify([core.services, core.supplies, core.strain, core.ap, core.resupplyUsed, core.stableStreak, core.pending.map(p => [p.target, p.delta, p.dueRound])]);
}
function roundPlans(core: Core): { core: Core; plan: Operation[] }[] {
  const seen = new Set<string>(), out: { core: Core; plan: Operation[] }[] = [];
  function walk(c: Core, plan: Operation[]) {
    const k = key(c);
    if (seen.has(k)) return;
    seen.add(k); out.push({ core: c, plan });
    if (c.ap === 0) return;
    for (const op of legalOperations(c)) {
      // This search can establish a witness without the larger tactical action set.
      if (op.type !== "act" || ["isolate", "restore_automation", "emergency_support"].includes(op.action)) continue;
      const next = structuredClone(c);
      executeOperation(next, op, [], "search");
      walk(next, [...plan, op]);
    }
  }
  walk(core, []);
  return out;
}
function solve(scenario: Scenario, width: number): Operation[][] | null {
  let frontier: Node[] = [{ core: createAuthoredRun(scenario.id).core, plans: [] }];
  for (let round = 1; round <= 12; round++) {
    const candidates = new Map<string, Node>();
    for (const node of frontier) for (const candidate of roundPlans(node.core)) {
      const end = resolveRound(candidate.core, scenario.rounds[round - 1]!).end;
      const plans = [...node.plans, candidate.plan];
      if (end.ending?.outcome === "win") return plans;
      if (end.ending) continue;
      end.round++; end.ap = 3; end.resupplyUsed = false; end.toolUsed = false;
      for (const id of SERVICES) { end.services[id].support = 0; end.services[id].authorityHeld = false; }
      const k = key(end);
      if (!candidates.has(k)) candidates.set(k, { core: end, plans });
    }
    frontier = [...candidates.values()].sort((a, b) => score(b.core) - score(a.core)).slice(0, width);
    if (!frontier.length) return null;
  }
  return null;
}
const witnesses = [];
for (const scenario of SCENARIOS) {
  const start = performance.now(), plans = solve(scenario, 16);
  if (!plans) throw new Error("No witness found for " + scenario.id);
  console.log(scenario.id, plans.length, "rounds", Math.round(performance.now() - start), "ms");
  witnesses.push({ id: scenario.id, knowledge: "privileged bounded search; not a human policy", plans });
}
writeFileSync("design/engine-witnesses-v0.2.json", JSON.stringify({ rulesVersion: "0.2.0", witnesses }, null, 2) + "\n");

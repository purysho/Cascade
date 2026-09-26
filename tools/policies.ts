// These strategies only receive projectForPlayer(), never a run definition,
// a seed, a certificate, or an unrevealed directive schedule.
import { legalOperations, executeOperation } from "../src/domain/actions.ts";
import { capacities } from "../src/domain/availability.ts";
import { resolveRound } from "../src/domain/resolve.ts";
import type { projectForPlayer } from "../src/domain/project.ts";
import { SERVICES } from "../src/domain/types.ts";
import type { Core, Operation, ServiceId } from "../src/domain/types.ts";

export const POLICIES = ["no_intervention", "repair_only", "isolation_heavy", "emergency_first", "grid_first", "comms_first", "transit_first", "adaptive"] as const;
export type Policy = typeof POLICIES[number];
type PublicView = ReturnType<typeof projectForPlayer>;
function evaluate(core: Core): number {
  if (core.ending?.outcome === "win") return 10000;
  if (core.ending) return -10000 - core.strain;
  const capacity = capacities(core);
  let score = -core.strain * 7 + core.supplies * 1.1 + core.stableStreak * 50;
  for (const id of SERVICES) {
    const s = core.services[id];
    score += (s.mode === "regulated" ? 32 : 0) + (s.backup ? 7 : 0)
      + Math.min(4, capacity[id]) * 5 + Math.max(0, s.integrity - 4);
    if (capacity[id] < 3) score -= 10;
  }
  score -= core.pending.reduce((n, p) => n - p.delta * 3, 0);
  return score;
}
export function choosePlan(view: PublicView, policy: Policy): Operation[] {
  if (policy === "no_intervention") return [];
  if (policy === "isolation_heavy") {
    const core = structuredClone(view.core), out: Operation[] = [];
    for (const target of SERVICES) {
      const op = legalOperations(core).find(o => o.type === "act" && o.action === "isolate" && o.target === target);
      if (op) { executeOperation(core, op, [], "policy"); out.push(op); }
    }
    return out;
  }
  const priority = policy.endsWith("_first") ? policy.replace("_first", "") as ServiceId : null;
  const firstRegulationMissing = !SERVICES.some(id => view.core.services[id].mode === "regulated");
  let best: Operation[] = [], bestScore = -Infinity;
  const seen = new Set<string>();
  function walk(core: Core, plan: Operation[]) {
    const key = JSON.stringify([core.services, core.supplies, core.ap, core.resupplyUsed]);
    if (seen.has(key)) return;
    seen.add(key);
    const outcome = resolveRound(core, view.directives.map(d => d.id)).end;
    const score = evaluate(outcome);
    if (score > bestScore) { bestScore = score; best = plan; }
    if (core.ap === 0) return;
    for (const op of legalOperations(core)) {
      // Decline drafts in all benchmark policies so the comparison isolates the
      // base decisions. Tools and their boundaries have separate rule tests.
      if (op.type !== "act") continue;
      if (policy === "repair_only" && !["repair", "resupply"].includes(op.action)) continue;
      if (priority && firstRegulationMissing && "target" in op && ["prepare_backup", "enforce_oversight"].includes(op.action) && op.target !== priority) continue;
      const next = structuredClone(core);
      executeOperation(next, op, [], "policy");
      walk(next, [...plan, op]);
    }
  }
  walk(view.core, []);
  return best;
}

import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { CONTENT_HASH, SCENARIOS } from "../src/content/catalog.ts";
import { applyCommand, createAuthoredRun } from "../src/domain/engine.ts";
import { createSeededRun } from "../src/domain/generate.ts";
import { projectForPlayer } from "../src/domain/project.ts";
import type { GameState, RoundRecord, RunDescriptor } from "../src/domain/types.ts";
import { choosePlan, POLICIES } from "./policies.ts";

const start = performance.now();
const initialStates: GameState[] = [
  ...SCENARIOS.map(s => createAuthoredRun(s.id)),
  ...Array.from({ length: 24 }, (_, i) => createSeededRun("POLICY-" + i))
];
const rows: { crisis: RunDescriptor; policy: string; outcome: string; round: number; strain: number; history: RoundRecord[] }[] = [];
for (const initial of initialStates) {
  for (const policy of POLICIES) {
    let state = initial;
    const apply = (intent: Record<string, unknown>) => {
      const result = applyCommand(state, { ...intent, expectedRevision: state.revision });
      if (!result.ok) throw new Error(policy + ": " + result.error.message);
      state = result.state;
    };
    while (state.core.phase !== "terminal") {
      if (state.core.phase === "draft") apply({ type: "choose_tool", tool: null });
      for (const op of choosePlan(projectForPlayer(state), policy)) apply(op);
      apply({ type: "commit_round" });
    }
    rows.push({ crisis: initial.definition.descriptor, policy, outcome: state.core.ending!.outcome,
      round: state.core.round, strain: state.core.strain, history: state.history });
  }
}
const summary = POLICIES.map(policy => {
  const runs = rows.filter(r => r.policy === policy), wins = runs.filter(r => r.outcome === "win");
  return { policy, runs: runs.length, wins: wins.length, collapse: runs.filter(r => r.outcome === "collapse").length,
    deadline: runs.filter(r => r.outcome === "deadline").length,
    averageWinRound: wins.length ? Number((wins.reduce((sum, r) => sum + r.round, 0) / wins.length).toFixed(2)) : null };
});
const report = { contentHash: CONTENT_HASH, sample: "Three authored crises and POLICY-0 through POLICY-23", elapsedMs: Math.round(performance.now() - start),
  knowledge: "Current public view and one-round forecasts only. No seed, hidden schedule or recovery certificate.",
  method: "Fixed-first strategies prioritize that service until the first regulation, then use the same one-round heuristic as adaptive. All policies decline tool drafts.",
  limitations: ["Small deterministic sample, not optimal-strategy analysis.", "Policies do not represent human skill, fun, comprehension or tool use."],
  summary, runs: rows };
mkdirSync("verification", { recursive: true });
writeFileSync("verification/strategy-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ sample: report.sample, elapsedMs: report.elapsedMs, summary }, null, 2));

import { createAuthoredRun, applyCommand } from "../src/domain/engine.ts";
import { generateRun, WITNESSES } from "../src/domain/generate.ts";
import { capacities } from "../src/domain/availability.ts";
import { SERVICES } from "../src/domain/types.ts";
import type { Operation } from "../src/domain/types.ts";

const seed = process.argv[2] ?? "CASCADE";
const authored = process.argv[3] === "--authored";
const generated = authored ? null : generateRun(seed);
let state = generated?.state ?? createAuthoredRun(seed);
const plans = generated?.certificate.plans ?? WITNESSES.find(w => w.id === seed)!.plans;
console.log("CASCADE — engine demonstration, not a playable interface");
console.log("Crisis:", state.definition.scenario.name);
if (generated) console.log("Generation:", generated.diagnostics);
console.log("Automated recovery certificate follows; it has privileged knowledge of the schedule.");
function apply(intent: Record<string, unknown>) {
  const result = applyCommand(state, { ...intent, expectedRevision: state.revision });
  if (!result.ok) throw new Error(result.error.message);
  state = result.state;
  return result;
}
for (const plan of plans) {
  if (state.core.phase === "draft") apply({ type: "choose_tool", tool: null });
  const round = state.core.round;
  console.log("\nRound", round, "orders:", state.definition.scenario.rounds[round - 1]!.join(", "));
  for (const op of plan as Operation[]) { console.log(" ", op); apply(op); }
  const result = apply({ type: "commit_round" });
  const end = result.resolution!.end;
  console.log(" Capacity G/T/C/E:", SERVICES.map(id => capacities(end)[id]).join("/"),
    "| supplies", end.supplies, "| strain", end.strain, "| stable checks", end.stableStreak);
  if (end.ending) console.log(end.ending.outcome.toUpperCase(), end.ending.reasons.join(" "));
}

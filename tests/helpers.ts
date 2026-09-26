import assert from "node:assert/strict";
import { applyCommand, createAuthoredRun } from "../src/domain/engine.ts";
import type { Command, GameState, Operation, Resolution } from "../src/domain/types.ts";

export type Intent = Command extends infer C ? C extends Command ? Omit<C, "expectedRevision"> : never : never;
export function send(state: GameState, intent: Intent) {
  const result = applyCommand(state, { ...intent, expectedRevision: state.revision });
  assert.equal(result.ok, true, result.ok ? "" : result.error.code + ": " + result.error.message);
  return result;
}
export function playPlans(state: GameState, plans: readonly (readonly Operation[])[]): { state: GameState; ends: Resolution[] } {
  const ends: Resolution[] = [];
  for (const plan of plans) {
    if (state.core.phase === "draft") state = send(state, { type: "choose_tool", tool: null }).state;
    for (const op of plan) state = send(state, op).state;
    const result = send(state, { type: "commit_round" });
    ends.push(result.resolution!);
    state = result.state;
  }
  return { state, ends };
}
export function fixture(): GameState { return createAuthoredRun("overdrive"); }

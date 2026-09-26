import type { DomainEvent } from "./types.ts";
export function emit(events: DomainEvent[], round: number, phase: DomainEvent["phase"], kind: string, cause: string,
  fields: Omit<DomainEvent, "id" | "round" | "phase" | "kind" | "cause"> = {}): void {
  events.push({ id: "r" + round + ":" + cause + ":" + events.length, round, phase, kind, cause, ...fields });
}

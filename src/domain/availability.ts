import { RULES } from "../content/catalog.ts";
import type { Core, Service, ServiceId, Vector } from "./types.ts";
import { SERVICES } from "./types.ts";

export function availability(service: Service, unboosted = false): number {
  if (service.integrity === 0) return 0;
  const c = RULES.constants;
  const base = service.mode === "isolated"
    ? Math.min(service.integrity, service.backup ? c.isolationCapWithBackup : c.isolationCapWithoutBackup)
    : service.integrity;
  return Math.min(c.integrityMax, base + (unboosted ? 0 : service.support));
}
export function capacities(core: Core, unboosted = false): Vector {
  return Object.fromEntries(SERVICES.map(id => [id, availability(core.services[id], unboosted)])) as Vector;
}
export function unmetRestoration(core: Core): string[] {
  const reasons: string[] = [];
  for (const id of SERVICES) {
    if (core.services[id].mode !== "regulated") reasons.push(id + ": oversight missing");
    if (availability(core.services[id], true) < RULES.constants.stableAvailability) reasons.push(id + ": lasting capacity below 4");
  }
  if (core.pending.length) reasons.push("Committed damage remains");
  return reasons;
}
export function blockedEndpoints(core: Core, required: readonly ServiceId[]): ServiceId[] {
  return required.filter(id => core.services[id].mode !== "autonomous" || core.services[id].authorityHeld);
}

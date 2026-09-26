import rulesData from "../../design/rules-v0.2.json" with { type: "json" };
import scenarioData from "../../design/scenarios-v0.1.json" with { type: "json" };
import { deepFreeze, fingerprint, validateRules, validateScenario } from "../domain/validate.ts";
import type { Directive, DirectiveId, Rules, Scenario } from "../domain/types.ts";

validateRules(rulesData);
for (const scenario of scenarioData.scenarios) validateScenario(scenario);
if (new Set(scenarioData.scenarios.map(s => s.id)).size !== scenarioData.scenarios.length) throw new Error("Duplicate scenario IDs");
export const RULES: Rules = deepFreeze(rulesData);
export const SCENARIOS: readonly Scenario[] = deepFreeze(scenarioData.scenarios as Scenario[]);
export const CONTENT_VERSION = "0.2.0";
export const CONTENT_HASH = fingerprint({ rules: RULES, scenarios: SCENARIOS, version: CONTENT_VERSION });
export const ORDERS = Object.fromEntries(RULES.directives.map(d => [d.id, d])) as Record<DirectiveId, Directive>;
deepFreeze(ORDERS);

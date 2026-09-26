import rulesData from "../../design/rules-v0.2.json" with { type: "json" };
import scenarioData from "../../design/scenarios-v0.1.json" with { type: "json" };
import tutorialData from "../../design/tutorials-v0.1.json" with { type: "json" };
import { deepFreeze, fingerprint, validateRules, validateScenario } from "../domain/validate.ts";
import { SERVICES } from "../domain/types.ts";
import type { Directive, DirectiveId, Rules, Scenario, TutorialSpec } from "../domain/types.ts";

validateRules(rulesData);
for (const scenario of scenarioData.scenarios) validateScenario(scenario);
if (new Set(scenarioData.scenarios.map(s => s.id)).size !== scenarioData.scenarios.length) throw new Error("Duplicate scenario IDs");

for (const tutorial of tutorialData.tutorials) {
  if (!/^[a-z0-9_-]{1,80}$/.test(tutorial.id)) throw new Error("Invalid tutorial ID");
  if (!tutorial.title || tutorial.title.length > 100 || !tutorial.task || tutorial.task.length > 500) throw new Error("Invalid tutorial copy");
  if (!SERVICES.includes(tutorial.focus as typeof SERVICES[number])) throw new Error("Invalid tutorial focus");
  if (!Array.isArray(tutorial.hints) || tutorial.hints.length < 1 || tutorial.hints.length > 4
    || tutorial.hints.some(h => typeof h !== "string" || h.length > 500)) throw new Error("Invalid tutorial hints");
  validateScenario(tutorial.scenario);
}
if (new Set(tutorialData.tutorials.map(t => t.id)).size !== tutorialData.tutorials.length) throw new Error("Duplicate tutorial IDs");
if (new Set(tutorialData.tutorials.map(t => t.scenario.id)).size !== tutorialData.tutorials.length) throw new Error("Duplicate tutorial scenario IDs");

export const RULES: Rules = deepFreeze(rulesData);
export const SCENARIOS: readonly Scenario[] = deepFreeze(scenarioData.scenarios as Scenario[]);
export const TUTORIALS: readonly TutorialSpec[] = deepFreeze(tutorialData.tutorials as TutorialSpec[]);
export const CONTENT_VERSION = "0.2.0";
export const CONTENT_HASH = fingerprint({ rules: RULES, scenarios: SCENARIOS, tutorials: TUTORIALS, version: CONTENT_VERSION });
export const ORDERS = Object.fromEntries(RULES.directives.map(d => [d.id, d])) as Record<DirectiveId, Directive>;
deepFreeze(ORDERS);

export const SERVICES = ["grid", "transit", "comms", "emergency"] as const;
export type ServiceId = typeof SERVICES[number];
export type Mode = "autonomous" | "isolated" | "regulated";
export const ACTIONS = ["repair", "prepare_backup", "isolate", "restore_automation", "enforce_oversight", "emergency_support", "resupply"] as const;
export type ActionId = typeof ACTIONS[number];
export const TOOLS = ["field_patch", "mobile_backup", "supply_drop", "civic_relief", "surge_support", "authority_lock"] as const;
export type ToolId = typeof TOOLS[number];
export const DIRECTIVES = ["G1", "G2", "T1", "T2", "C1", "C2", "E1", "E2"] as const;
export type DirectiveId = typeof DIRECTIVES[number];
export type Vector = Record<ServiceId, number>;
export type Action = { type: "act"; action: Exclude<ActionId, "resupply">; target: ServiceId }
  | { type: "act"; action: "resupply" };
export type ToolUse = { type: "use_tool"; tool: Exclude<ToolId, "supply_drop" | "civic_relief">; target: ServiceId }
  | { type: "use_tool"; tool: "supply_drop" | "civic_relief" };
export type Operation = Action | ToolUse;
export type Command = (Operation | { type: "undo" } | { type: "commit_round" }
  | { type: "choose_tool"; tool: ToolId | null }) & { expectedRevision: number };

export interface Scenario {
  id: string;
  name: string;
  description: string;
  initial: { integrity: Vector; supplies: number; strain: number };
  rounds: DirectiveId[][];
}
export interface Directive {
  id: DirectiveId;
  name: string;
  origin: ServiceId;
  requiresAutonomous: ServiceId[];
  integrityDelta: Partial<Vector>;
  strainDelta: number;
  efficiencyPoints: number;
  delayed: { afterRounds: number; target: ServiceId; integrityDelta: number }[];
}
export interface Rules {
  schemaVersion: number;
  rulesVersion: string;
  status: string;
  serviceOrder: ServiceId[];
  constants: Record<
    "maxRounds" | "actionsPerRound" | "integrityMin" | "integrityMax" | "stableAvailability"
    | "cascadeThresholdExclusive" | "cascadeDamagePerEdge" | "isolationCapWithoutBackup"
    | "isolationCapWithBackup" | "strainLossThreshold" | "simultaneousOutageLossCount"
    | "stableRoundsToWin" | "strainRecoveryOnZeroDeficit" | "supplyCap" | "repairGain"
    | "supportGain" | "resupplyNormal" | "resupplyDisrupted" | "resupplyTransitMinimum"
    | "resupplyCommsMinimum" | "regulationIntegrityMinimum", number>;
  modes: Mode[];
  dependencies: [ServiceId, ServiceId][];
  actions: Record<ActionId, { ap: number; supplies: number; target: string }>;
  directives: Directive[];
  roguelike: {
    draftRounds: number[]; offerSize: number; toolsPerRound: number;
    fieldPatchGain: number; supplyDropGain: number; civicReliefGain: number; surgeSupportGain: number;
    tools: { id: ToolId; name: string; description: string }[];
  };
}
export interface Service {
  integrity: number; mode: Mode; backup: boolean; support: number; authorityHeld: boolean;
}
export interface Pending {
  id: string; source: DirectiveId; originatingRound: number; dueRound: number; target: ServiceId; delta: number;
}
export interface Ending {
  outcome: "win" | "collapse" | "deadline";
  reasons: string[];
}
export interface Core {
  round: number;
  phase: "planning" | "draft" | "terminal";
  services: Record<ServiceId, Service>;
  supplies: number; strain: number; points: number; ap: number;
  resupplyUsed: boolean; toolUsed: boolean;
  pending: Pending[];
  stableStreak: number;
  inventory: ToolId[];
  ending: Ending | null;
}
export type RunDescriptor = { kind: "authored"; id: string } | { kind: "seeded"; seed: string };
export interface Definition {
  schemaVersion: 1;
  rulesVersion: string; contentVersion: string; generatorVersion: string | null;
  descriptor: RunDescriptor;
  scenario: Scenario;
  offers: ToolId[][];
}
export interface DraftChoice { round: number; tool: ToolId | null }
export interface RoundRecord { round: number; operations: Operation[] }
export interface GameState {
  definition: Definition;
  revision: number;
  core: Core;
  roundStart: Core;
  history: RoundRecord[];
  openPlan: Operation[];
  choices: DraftChoice[];
}
export interface DomainEvent {
  id: string; round: number;
  phase: "plan" | "due" | "orders" | "cascade" | "impact" | "ending";
  kind: string; cause: string;
  target?: string;
  before?: number | string | boolean;
  after?: number | string | boolean;
  detail?: string;
}
export interface RuleError { code: string; message: string }
export type Reduction = { ok: true; state: GameState; events: DomainEvent[]; resolution?: Resolution }
  | { ok: false; state: GameState; error: RuleError };
export interface Resolution { end: Core; events: DomainEvent[] }

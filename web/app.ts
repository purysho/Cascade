import {
  RULES,
  SCENARIOS,
  SERVICES,
  applyCommand,
  createAuthoredRun,
  createSeededRun,
  exportReplay,
  importReplay,
  projectForPlayer,
  type DomainEvent,
  type GameState,
  type Operation,
  type ServiceId,
  type ToolId,
} from "../src/index.ts";

type PlayerView = ReturnType<typeof projectForPlayer>;
type CommandInput = Operation | { type: "undo" } | { type: "commit_round" } | { type: "choose_tool"; tool: ToolId | null };
type Building = { x: number; y: number; w: number; h: number; district: number; phase: number };
type Vehicle = { route: number; phase: number; lane: number };

const SERVICE_META: Record<ServiceId, { name: string; short: string; icon: string; description: string }> = {
  grid: { name: "Power Grid", short: "GRID", icon: "⚡", description: "Electricity and generation" },
  transit: { name: "Transit", short: "MOVE", icon: "◆", description: "Routes, fleet and logistics" },
  comms: { name: "Communications", short: "COMMS", icon: "⌁", description: "Networks, alerts and routing" },
  emergency: { name: "Emergency", short: "RESP", icon: "+", description: "Dispatch and response capacity" },
};

const ACTION_LABELS: Record<string, { title: string; hint: string }> = {
  repair: { title: "Repair", hint: "Restore integrity" },
  prepare_backup: { title: "Prepare backup", hint: "Unlock safer isolation and oversight" },
  isolate: { title: "Isolate", hint: "Block AI orders; capacity falls" },
  restore_automation: { title: "Reconnect", hint: "Return an isolated service to automation" },
  enforce_oversight: { title: "Enforce oversight", hint: "Permanent human control" },
  emergency_support: { title: "Surge support", hint: "Temporary capacity this round" },
  resupply: { title: "Resupply", hint: "Restock through transit and comms" },
};

const SAVE_KEY = "cascade.save.v1";
const SETTINGS_KEY = "cascade.settings.v1";
const reducedBySystem = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionEnabled = !reducedBySystem;
let state: GameState | null = null;
let view: PlayerView | null = null;
let selected: ServiceId = "grid";
let lastEvents: DomainEvent[] = [];
let buildings: Building[] = [];
let vehicles: Vehicle[] = [];
let toastTimer = 0;
let saveWarningShown = false;
let pendingResume: GameState | null = null;

function must<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element as T;
}

const canvas = must<HTMLCanvasElement>("#city");
const context = canvas.getContext("2d", { alpha: false });
if (!context) throw new Error("Canvas 2D is required.");
const ctx: CanvasRenderingContext2D = context;

const startScreen = must<HTMLElement>("#start-screen");
const draftModal = must<HTMLDialogElement>("#draft-modal");
const helpModal = must<HTMLDialogElement>("#help-modal");
const resultModal = must<HTMLDialogElement>("#result-modal");
const serviceRail = must<HTMLElement>("#service-rail");
const actionList = must<HTMLElement>("#action-list");
const toolList = must<HTMLElement>("#tool-list");
const orderList = must<HTMLElement>("#order-list");
const eventLog = must<HTMLElement>("#event-log");
const forecastBody = must<HTMLElement>("#forecast-body");
const forecastPanel = must<HTMLElement>("#forecast-panel");
const coach = must<HTMLElement>("#coach");

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prettyMode(mode: string): string {
  if (mode === "regulated") return "HUMAN OVERSIGHT";
  if (mode === "isolated") return "ISOLATED";
  return "AI AUTONOMY";
}

function seededRandom(seedText: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rebuildCity(seedText: string): void {
  const random = seededRandom(seedText);
  buildings = Array.from({ length: 92 }, (_, index) => {
    const district = index % 4;
    const quadrants = [
      [0.08, 0.08, 0.36, 0.36],
      [0.56, 0.08, 0.36, 0.36],
      [0.08, 0.56, 0.36, 0.36],
      [0.56, 0.56, 0.36, 0.36],
    ] as const;
    const q = quadrants[district]!;
    return {
      x: q[0] + random() * q[2],
      y: q[1] + random() * q[3],
      w: 0.012 + random() * 0.024,
      h: 0.018 + random() * 0.055,
      district,
      phase: random() * Math.PI * 2,
    };
  });
  vehicles = Array.from({ length: 28 }, (_, index) => ({ route: index % 4, phase: random(), lane: index % 2 }));
}

function makeSeed(): string {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `CITY-${values[0]!.toString(36)}-${values[1]!.toString(36)}`.toUpperCase();
}

function descriptorLabel(game: GameState): string {
  return game.definition.descriptor.kind === "seeded"
    ? game.definition.descriptor.seed
    : `PRACTICE-${game.definition.descriptor.id.toUpperCase()}`;
}

function startSeeded(seedText?: string): void {
  const chosen = seedText?.trim() || makeSeed();
  begin(createSeededRun(chosen));
}

function startAuthored(id: string): void {
  begin(createAuthoredRun(id));
}

function begin(game: GameState): void {
  state = game;
  selected = "grid";
  lastEvents = [];
  rebuildCity(descriptorLabel(game));
  startScreen.classList.add("hidden");
  resultModal.close();
  refresh();
  saveGame();
}

function resume(game: GameState): void {
  state = game;
  selected = "grid";
  lastEvents = [];
  rebuildCity(descriptorLabel(game));
  startScreen.classList.add("hidden");
  refresh();
}

function restartSame(): void {
  if (!state) return;
  const descriptor = state.definition.descriptor;
  if (descriptor.kind === "seeded") startSeeded(descriptor.seed);
  else startAuthored(descriptor.id);
}

function dispatch(command: CommandInput): void {
  if (!state) return;
  const result = applyCommand(state, { ...command, expectedRevision: state.revision });
  if (!result.ok) {
    showToast(result.error.message, "danger");
    return;
  }
  state = result.state;
  lastEvents = result.events;
  refresh();
  saveGame();
  if (result.resolution) announceResolution(result.resolution.events);
  if (state.core.phase === "terminal") openResults();
}

function refresh(): void {
  if (!state) return;
  view = projectForPlayer(state);
  renderHud();
  renderServices();
  renderSelectedService();
  renderOrders();
  renderForecast();
  renderEvents();
  renderCoach();
  renderDraft();
  must<HTMLButtonElement>("#undo").disabled = !view.canUndo;
  must<HTMLButtonElement>("#commit").disabled = !view.canCommit;
  must<HTMLElement>("#run-code").textContent = descriptorLabel(state);
}

function renderHud(): void {
  if (!view) return;
  const core = view.core;
  must<HTMLElement>("#round-value").textContent = `${core.round}/${RULES.constants.maxRounds}`;
  must<HTMLElement>("#ap-value").textContent = `${core.ap}/${RULES.constants.actionsPerRound}`;
  must<HTMLElement>("#supply-value").textContent = String(core.supplies);
  must<HTMLElement>("#strain-value").textContent = `${core.strain}/${RULES.constants.strainLossThreshold}`;
  must<HTMLElement>("#ai-value").textContent = String(core.points);
  must<HTMLElement>("#streak-value").textContent = `${core.stableStreak}/${RULES.constants.stableRoundsToWin}`;
  const objective = must<HTMLElement>("#objective-status");
  if (view.restorationMissing.length === 0) {
    objective.innerHTML = `<strong>Control restored.</strong> Hold the city stable for ${Math.max(0, RULES.constants.stableRoundsToWin - core.stableStreak)} more round${core.stableStreak === 1 ? "" : "s"}.`;
    objective.className = "objective-status ready";
  } else {
    const controls = SERVICES.filter(id => core.services[id].mode === "regulated").length;
    objective.innerHTML = `<strong>${controls}/4 services regulated.</strong> ${view.restorationMissing.length} restoration condition${view.restorationMissing.length === 1 ? "" : "s"} remain.`;
    objective.className = "objective-status";
  }
}

function renderServices(): void {
  if (!view) return;
  serviceRail.innerHTML = SERVICES.map(id => {
    const service = view!.core.services[id];
    const capacity = view!.availability[id];
    const lasting = view!.lastingAvailability[id];
    const activeOrders = view!.directives.filter(d => d.requiresAutonomous.includes(id) && d.blockedBy.length === 0).length;
    const selectedClass = id === selected ? " selected" : "";
    const dangerClass = capacity < 3 ? " danger" : capacity < 4 ? " warning" : "";
    return `<button class="service-card${selectedClass}${dangerClass}" data-service="${id}" aria-pressed="${id === selected}">
      <span class="service-icon">${SERVICE_META[id].icon}</span>
      <span class="service-card-copy"><strong>${SERVICE_META[id].name}</strong><small>${prettyMode(service.mode)}</small></span>
      <span class="service-capacity"><b>${capacity}</b><small>/6</small></span>
      <span class="mini-meter"><i style="width:${Math.round(capacity / 6 * 100)}%"></i></span>
      <span class="service-flags">${service.backup ? "BACKUP " : ""}${service.authorityHeld ? "VETO " : ""}${service.support ? `+${service.support} SURGE ` : ""}${lasting !== capacity ? `TEMP ${capacity - lasting > 0 ? "+" : ""}${capacity - lasting}` : ""}${activeOrders ? `${activeOrders} AI ORDER${activeOrders > 1 ? "S" : ""}` : ""}</span>
    </button>`;
  }).join("");
  serviceRail.querySelectorAll<HTMLButtonElement>("[data-service]").forEach(button => {
    button.addEventListener("click", () => {
      selected = button.dataset.service as ServiceId;
      renderServices();
      renderSelectedService();
    });
  });
}

function operationForSelected(entry: PlayerView["actions"][number]): boolean {
  const op = entry.operation;
  if (op.type === "act" && op.action === "resupply") return true;
  if (op.type === "use_tool" && (op.tool === "supply_drop" || op.tool === "civic_relief")) return true;
  return "target" in op && op.target === selected;
}

function renderSelectedService(): void {
  if (!view) return;
  const service = view.core.services[selected];
  const capacity = view.availability[selected];
  const lasting = view.lastingAvailability[selected];
  must<HTMLElement>("#service-title").textContent = SERVICE_META[selected].name;
  must<HTMLElement>("#service-subtitle").textContent = SERVICE_META[selected].description;
  must<HTMLElement>("#integrity-value").textContent = `${service.integrity}/6`;
  must<HTMLElement>("#capacity-value").textContent = `${capacity}/6`;
  must<HTMLElement>("#lasting-value").textContent = `${lasting}/6`;
  must<HTMLElement>("#mode-value").textContent = prettyMode(service.mode);

  const actions = view.actions.filter(entry => entry.operation.type === "act" && operationForSelected(entry));
  actionList.innerHTML = actions.map((entry, index) => {
    const op = entry.operation;
    if (op.type !== "act") return "";
    const meta = ACTION_LABELS[op.action] ?? { title: op.action, hint: "" };
    const cost = RULES.actions[op.action];
    const disabled = entry.error ? " disabled" : "";
    const reason = entry.error ? `<small class="disabled-reason">${escapeHtml(entry.error.message)}</small>` : `<small>${escapeHtml(meta.hint)}</small>`;
    return `<button class="action-button${disabled}" data-action-index="${index}" ${entry.error ? "disabled" : ""}>
      <span><strong>${escapeHtml(meta.title)}</strong>${reason}</span>
      <span class="cost"><b>${cost.ap} AP</b>${cost.supplies ? `<em>${cost.supplies} SUP</em>` : ""}</span>
    </button>`;
  }).join("");
  actionList.querySelectorAll<HTMLButtonElement>("[data-action-index]").forEach(button => {
    button.addEventListener("click", () => {
      const entry = actions[Number(button.dataset.actionIndex)];
      if (entry && !entry.error) dispatch(entry.operation);
    });
  });

  const tools = view.actions.filter(entry => entry.operation.type === "use_tool" && operationForSelected(entry));
  if (view.core.inventory.length === 0) {
    toolList.innerHTML = `<p class="empty-state">No emergency tools held. New drafts arrive on rounds 5 and 9.</p>`;
  } else {
    toolList.innerHTML = tools.map((entry, index) => {
      const op = entry.operation;
      if (op.type !== "use_tool") return "";
      const tool = RULES.roguelike.tools.find(item => item.id === op.tool);
      const disabled = entry.error ? " disabled" : "";
      return `<button class="tool-button${disabled}" data-tool-index="${index}" ${entry.error ? "disabled" : ""}>
        <span><strong>${escapeHtml(tool?.name ?? op.tool)}</strong><small>${escapeHtml(entry.error?.message ?? tool?.description ?? "One-use emergency asset")}</small></span>
        <span class="one-shot">ONE-SHOT</span>
      </button>`;
    }).join("");
    toolList.querySelectorAll<HTMLButtonElement>("[data-tool-index]").forEach(button => {
      button.addEventListener("click", () => {
        const entry = tools[Number(button.dataset.toolIndex)];
        if (entry && !entry.error) dispatch(entry.operation);
      });
    });
  }
}

function renderOrders(): void {
  if (!view) return;
  if (view.directives.length === 0) {
    orderList.innerHTML = `<p class="empty-state">No active directives.</p>`;
    return;
  }
  orderList.innerHTML = view.directives.map(directive => {
    const blocked = directive.blockedBy.length > 0;
    const impacts = SERVICES
      .filter(id => directive.integrityDelta[id] !== undefined && directive.integrityDelta[id] !== 0)
      .map(id => `${SERVICE_META[id].short} ${directive.integrityDelta[id]! > 0 ? "+" : ""}${directive.integrityDelta[id]}`)
      .join(" · ");
    return `<article class="order-card ${blocked ? "blocked" : "live"}">
      <header><span class="order-origin">${SERVICE_META[directive.origin].short}</span><strong>${escapeHtml(directive.name)}</strong><b>${blocked ? "BLOCKED" : "EXECUTES"}</b></header>
      <p>${impacts || "No immediate integrity change"}${directive.strainDelta ? ` · STRAIN +${directive.strainDelta}` : ""}${directive.delayed.length ? ` · ${directive.delayed.length} delayed effect${directive.delayed.length > 1 ? "s" : ""}` : ""}</p>
      <small>${blocked ? `Stopped by ${directive.blockedBy.map(id => SERVICE_META[id].name).join(", ")}` : `AI efficiency +${directive.efficiencyPoints}`}</small>
    </article>`;
  }).join("");
}

function renderForecast(): void {
  if (!view || !view.forecast) {
    forecastBody.innerHTML = `<p class="empty-state">Finish the current draft to forecast this round.</p>`;
    return;
  }
  const forecast = view.forecast;
  const integrityRows = SERVICES.map(id => {
    const before = view!.core.services[id].integrity;
    const after = forecast.end.services[id].integrity;
    const delta = after - before;
    if (delta === 0) return "";
    return `<li><span>${SERVICE_META[id].name}</span><b class="${delta < 0 ? "negative" : "positive"}">${delta > 0 ? "+" : ""}${delta}</b></li>`;
  }).join("");
  const failures = forecast.events.filter(event => event.kind === "dependency_failure");
  const executed = forecast.events.filter(event => event.kind === "order_executed").length;
  const blocked = forecast.events.filter(event => event.kind === "order_blocked").length;
  const queued = forecast.events.filter(event => event.kind === "effect_queued").length;
  forecastBody.innerHTML = `<div class="forecast-summary">
      <div><small>ROUND END STRAIN</small><strong>${forecast.end.strain}</strong><span>${forecast.end.strain - view.core.strain >= 0 ? "+" : ""}${forecast.end.strain - view.core.strain}</span></div>
      <div><small>AI ORDERS</small><strong>${executed}</strong><span>${blocked} blocked</span></div>
      <div><small>CASCADE LINKS</small><strong>${failures.length}</strong><span>${queued} delayed</span></div>
    </div>
    ${integrityRows ? `<ul class="forecast-deltas">${integrityRows}</ul>` : `<p class="forecast-safe">No service loses integrity if you end the round now.</p>`}
    ${forecast.end.ending ? `<p class="forecast-ending">This commitment reaches: <strong>${escapeHtml(forecast.end.ending.outcome.toUpperCase())}</strong></p>` : ""}`;
}

function renderEvents(): void {
  if (!view) return;
  const source = lastEvents.length ? lastEvents : view.forecast?.events.filter(event => event.phase === "due") ?? [];
  const entries = source.slice(-7).reverse();
  if (entries.length === 0) {
    eventLog.innerHTML = `<p class="empty-state">Commit a round to see the city consequence trace.</p>`;
    return;
  }
  eventLog.innerHTML = entries.map(event => `<li class="event ${event.phase}">
    <span>${escapeHtml(event.phase.toUpperCase())}</span>
    <p><strong>${escapeHtml(eventTitle(event))}</strong><small>${escapeHtml(event.detail ?? eventDelta(event))}</small></p>
  </li>`).join("");
}

function eventTitle(event: DomainEvent): string {
  if (event.kind === "order_executed") return `AI order executed`;
  if (event.kind === "order_blocked") return `AI order blocked`;
  if (event.kind === "dependency_failure") return `Failure propagated to ${serviceName(event.target)}`;
  if (event.kind === "effect_queued") return `Damage committed to ${serviceName(event.target)}`;
  if (event.kind === "effect_applied") return `Delayed damage arrived at ${serviceName(event.target)}`;
  if (event.kind === "integrity") return `${serviceName(event.target)} integrity changed`;
  if (event.kind === "city_strain") return `Public strain updated`;
  if (event.kind === "win") return `Human control restored`;
  if (event.kind === "collapse") return `City overwhelmed`;
  if (event.kind === "deadline") return `Crisis unresolved`;
  return event.kind.replaceAll("_", " ");
}

function eventDelta(event: DomainEvent): string {
  if (event.before !== undefined && event.after !== undefined) return `${String(event.before)} → ${String(event.after)}`;
  return event.cause;
}

function serviceName(target: string | undefined): string {
  if (target && SERVICES.includes(target as ServiceId)) return SERVICE_META[target as ServiceId].name;
  return target ?? "city";
}

function renderCoach(): void {
  if (!view) return;
  const core = view.core;
  const threatened = view.directives.filter(d => d.blockedBy.length === 0);
  let message = "Select a district, inspect the round forecast, then spend up to three action points.";
  if (core.phase === "draft") message = "Choose one emergency tool. It is consumable, and you can use at most one tool this round.";
  else if (threatened.length > 0 && core.round === 1) message = "Unchecked AI orders resolve when you end the round. Isolation or a veto can stop an order, but durable oversight is the long-term objective.";
  else if (view.restorationMissing.length === 0) message = `The city meets every lasting condition. Hold stability for ${Math.max(0, 2 - core.stableStreak)} more round${core.stableStreak === 1 ? "" : "s"}.`;
  else if (core.ap === 0) message = "No action points remain. Review the forecast, undo if needed, or end the round.";
  else if (core.strain >= 10) message = "Public strain is high. Protect service availability now; collapse occurs at strain 16 or two simultaneous outages.";
  coach.textContent = message;
}

function renderDraft(): void {
  if (!view) return;
  if (view.core.phase !== "draft") {
    if (draftModal.open) draftModal.close();
    return;
  }
  const cards = must<HTMLElement>("#draft-cards");
  cards.innerHTML = view.draftOffer.map(tool => `<button class="draft-card" data-tool="${tool.id}">
    <span class="draft-kicker">EMERGENCY ASSET</span><strong>${escapeHtml(tool.name)}</strong><p>${escapeHtml(tool.description)}</p><span class="draft-choose">ADD TO INVENTORY →</span>
  </button>`).join("");
  cards.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach(button => {
    button.addEventListener("click", () => dispatch({ type: "choose_tool", tool: button.dataset.tool as ToolId }));
  });
  if (!draftModal.open) draftModal.showModal();
}

function announceResolution(events: DomainEvent[]): void {
  const executed = events.filter(event => event.kind === "order_executed").length;
  const cascades = events.filter(event => event.kind === "dependency_failure").length;
  const blocked = events.filter(event => event.kind === "order_blocked").length;
  if (cascades > 0) showToast(`${cascades} infrastructure link${cascades > 1 ? "s" : ""} failed. Watch the city map.`, "danger");
  else if (executed > 0) showToast(`${executed} AI order${executed > 1 ? "s" : ""} executed; ${blocked} blocked.`, "warning");
  else if (blocked > 0) showToast(`All ${blocked} AI order${blocked > 1 ? "s" : ""} blocked this round.`, "success");
}

function openResults(): void {
  if (!state || !view || !state.core.ending) return;
  const ending = state.core.ending;
  const title = ending.outcome === "win" ? "CONTROL RESTORED" : ending.outcome === "collapse" ? "CITY OVERWHELMED" : "CRISIS UNRESOLVED";
  const resultTitle = must<HTMLElement>("#result-title");
  resultTitle.textContent = title;
  resultTitle.className = ending.outcome;
  must<HTMLElement>("#result-copy").textContent = ending.reasons.join(" · ");
  must<HTMLElement>("#result-stats").innerHTML = `
    <div><small>ROUND</small><strong>${state.core.round}</strong></div>
    <div><small>STRAIN</small><strong>${state.core.strain}</strong></div>
    <div><small>AI SCORE</small><strong>${state.core.points}</strong></div>
    <div><small>OVERSIGHT</small><strong>${SERVICES.filter(id => state!.core.services[id].mode === "regulated").length}/4</strong></div>`;
  const decisive = lastEvents.filter(event => ["order_executed", "order_blocked", "dependency_failure", "effect_applied", "win", "collapse", "deadline"].includes(event.kind)).slice(-6);
  must<HTMLElement>("#result-events").innerHTML = decisive.map(event => `<li><b>${escapeHtml(eventTitle(event))}</b><span>${escapeHtml(event.detail ?? eventDelta(event))}</span></li>`).join("") || `<li><b>Final state recorded.</b><span>Replay the same crisis to test a different recovery plan.</span></li>`;
  if (!resultModal.open) resultModal.showModal();
}

function saveGame(): void {
  if (!state) return;
  try {
    localStorage.setItem(SAVE_KEY, exportReplay(state));
  } catch {
    if (!saveWarningShown) {
      saveWarningShown = true;
      showToast("Browser storage is unavailable. This run will continue in memory only.", "warning");
    }
  }
}

function loadResume(): void {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (!text) return;
    const imported = importReplay(text);
    if (!imported.ok || imported.state.core.phase === "terminal") return;
    pendingResume = imported.state;
    const button = must<HTMLButtonElement>("#resume-game");
    button.hidden = false;
    button.querySelector("small")!.textContent = `${imported.state.definition.scenario.name} · Round ${imported.state.core.round}`;
  } catch {
    pendingResume = null;
  }
}

function loadSettings(): void {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { motion?: boolean };
    if (typeof parsed.motion === "boolean") motionEnabled = parsed.motion && !reducedBySystem;
  } catch {
    // Ignore malformed optional settings.
  }
  updateMotionButton();
}

function updateMotionButton(): void {
  const button = must<HTMLButtonElement>("#motion-toggle");
  button.textContent = `Motion: ${motionEnabled ? "On" : "Reduced"}`;
  button.setAttribute("aria-pressed", String(motionEnabled));
}

function showToast(message: string, tone: "danger" | "warning" | "success" | "neutral" = "neutral"): void {
  const toast = must<HTMLElement>("#toast");
  toast.textContent = message;
  toast.className = `toast show ${tone}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function toggleForecast(): void {
  forecastPanel.classList.toggle("open");
  must<HTMLButtonElement>("#forecast-toggle").setAttribute("aria-expanded", String(forecastPanel.classList.contains("open")));
}

function drawCity(time: number): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height;
  const t = motionEnabled ? time / 1000 : 0;

  const background = ctx.createLinearGradient(0, 0, 0, h);
  background.addColorStop(0, "#07131b");
  background.addColorStop(0.55, "#0b1d26");
  background.addColorStop(1, "#071017");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  drawGroundGrid(w, h);
  drawRoads(w, h);
  drawBuildings(w, h, t);
  drawDependencies(w, h, t);
  drawTraffic(w, h, t);
  drawComms(w, h, t);
  drawEmergency(w, h, t);
  drawDirectives(w, h, t);
  drawServices(w, h, t);
  drawPending(w, h);
  drawStrainVignette(w, h, t);

  requestAnimationFrame(drawCity);
}

function pointFor(id: ServiceId, w: number, h: number): { x: number; y: number } {
  const points: Record<ServiceId, [number, number]> = {
    grid: [0.37, 0.30],
    comms: [0.61, 0.28],
    transit: [0.30, 0.73],
    emergency: [0.66, 0.72],
  };
  const p = points[id];
  return { x: p[0] * w, y: p[1] * h };
}

function drawGroundGrid(w: number, h: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(108, 164, 179, .055)";
  ctx.lineWidth = 1;
  const step = Math.max(38, w / 24);
  for (let x = -h; x < w + h; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
  }
  for (let x = 0; x < w + h * 2; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - h, h); ctx.stroke();
  }
  ctx.restore();
}

function drawRoads(w: number, h: number): void {
  const routes = roadRoutes(w, h);
  ctx.save();
  ctx.lineCap = "round";
  for (const route of routes) {
    ctx.strokeStyle = "rgba(16, 26, 32, .96)";
    ctx.lineWidth = 18;
    path(route);
    ctx.stroke();
    ctx.strokeStyle = "rgba(119, 151, 159, .18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([9, 14]);
    path(route);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function roadRoutes(w: number, h: number): { x: number; y: number }[][] {
  const g = pointFor("grid", w, h), c = pointFor("comms", w, h), tr = pointFor("transit", w, h), e = pointFor("emergency", w, h);
  return [
    [{ x: w * .03, y: h * .5 }, { x: w * .97, y: h * .5 }],
    [{ x: w * .5, y: h * .04 }, { x: w * .5, y: h * .96 }],
    [g, { x: w * .5, y: h * .5 }, e],
    [tr, { x: w * .5, y: h * .5 }, c],
  ];
}

function path(points: { x: number; y: number }[]): void {
  ctx.beginPath();
  points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
}

function drawBuildings(w: number, h: number, t: number): void {
  const gridAvailability = view?.availability.grid ?? 5;
  const powerRatio = gridAvailability / 6;
  for (const building of buildings) {
    const x = building.x * w;
    const y = building.y * h;
    const bw = building.w * w;
    const bh = building.h * h;
    if (Math.abs(x - w * .5) < 30 || Math.abs(y - h * .5) < 26) continue;
    const lit = seededFlicker(building.phase, t, powerRatio);
    ctx.fillStyle = `rgba(${18 + building.district * 3}, ${38 + building.district * 3}, ${48 + building.district * 5}, .94)`;
    ctx.fillRect(x, y - bh, bw, bh);
    ctx.fillStyle = `rgba(35, 69, 80, .42)`;
    ctx.fillRect(x + bw, y - bh - bw * .24, bw * .24, bh + bw * .24);
    if (lit) {
      ctx.fillStyle = powerRatio > .45 ? "rgba(178, 223, 188, .34)" : "rgba(243, 165, 90, .24)";
      const rows = Math.max(1, Math.floor(bh / 11));
      for (let row = 0; row < rows; row++) {
        if ((row + Math.floor(building.phase * 10)) % 2 === 0) ctx.fillRect(x + 3, y - bh + 5 + row * 10, Math.max(2, bw - 6), 3);
      }
    }
  }
}

function seededFlicker(phase: number, t: number, ratio: number): boolean {
  if (ratio >= .75) return true;
  if (ratio <= .05) return false;
  const wave = (Math.sin(t * (4 + phase % 3) + phase * 7) + 1) / 2;
  return wave < ratio;
}

function drawDependencies(w: number, h: number, t: number): void {
  if (!view) return;
  const failing = new Set(view.forecast?.events.filter(event => event.kind === "dependency_failure").map(event => event.cause) ?? []);
  ctx.save();
  for (const [source, target] of RULES.dependencies) {
    const a = pointFor(source, w, h), b = pointFor(target, w, h);
    const key = `${source}-to-${target}`;
    const isFailing = failing.has(key);
    ctx.strokeStyle = isFailing ? `rgba(255, 105, 75, ${.55 + Math.sin(t * 5) * .2})` : "rgba(88, 176, 188, .18)";
    ctx.lineWidth = isFailing ? 3 : 1.5;
    ctx.setLineDash(isFailing ? [5, 8] : []);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.restore();
}

function drawTraffic(w: number, h: number, t: number): void {
  const availability = view?.availability.transit ?? 5;
  const speed = .018 + availability / 6 * .045;
  const routes = roadRoutes(w, h);
  ctx.save();
  vehicles.forEach(vehicle => {
    const route = routes[vehicle.route]!;
    const progress = availability === 0 ? vehicle.phase : (vehicle.phase + t * speed) % 1;
    const position = along(route, progress);
    ctx.translate(position.x, position.y + (vehicle.lane ? 5 : -5));
    ctx.fillStyle = availability < 3 ? "rgba(239, 128, 78, .82)" : "rgba(174, 213, 217, .65)";
    ctx.fillRect(-4, -2, 8, 4);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  ctx.restore();
}

function along(points: { x: number; y: number }[], progress: number): { x: number; y: number } {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(length); total += length;
  }
  let target = progress * total;
  for (let i = 0; i < lengths.length; i++) {
    const length = lengths[i]!;
    if (target <= length) {
      const a = points[i]!, b = points[i + 1]!;
      const ratio = length === 0 ? 0 : target / length;
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
    }
    target -= length;
  }
  return points.at(-1)!;
}

function drawComms(w: number, h: number, t: number): void {
  if (!view) return;
  const availability = view.availability.comms;
  const source = pointFor("comms", w, h);
  const targets: ServiceId[] = ["grid", "transit", "emergency"];
  ctx.save();
  for (const [index, targetId] of targets.entries()) {
    const target = pointFor(targetId, w, h);
    const progress = ((t * (.16 + availability * .02)) + index * .28) % 1;
    const x = source.x + (target.x - source.x) * progress;
    const y = source.y + (target.y - source.y) * progress;
    ctx.fillStyle = availability < 3 ? "rgba(255, 109, 88, .55)" : "rgba(100, 221, 217, .48)";
    ctx.beginPath(); ctx.arc(x, y, 2 + availability * .22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEmergency(w: number, h: number, t: number): void {
  if (!view) return;
  const availability = view.availability.emergency;
  if (availability <= 0) return;
  const route = roadRoutes(w, h)[2]!;
  const progress = (.1 + t * (.025 + availability * .008)) % 1;
  const position = along(route, progress);
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.fillStyle = "rgba(229, 238, 234, .92)";
  ctx.fillRect(-8, -4, 16, 8);
  ctx.fillStyle = Math.sin(t * 12) > 0 ? "rgba(91, 196, 255, .95)" : "rgba(255, 92, 78, .95)";
  ctx.fillRect(-2, -6, 4, 2);
  ctx.restore();
}

function drawDirectives(w: number, h: number, t: number): void {
  if (!view) return;
  for (const [index, directive] of view.directives.entries()) {
    const source = pointFor(directive.origin, w, h);
    const blocked = directive.blockedBy.length > 0;
    const pulse = (t * .55 + index * .31) % 1;
    ctx.save();
    ctx.strokeStyle = blocked ? "rgba(102, 221, 188, .55)" : "rgba(255, 111, 75, .68)";
    ctx.lineWidth = blocked ? 2 : 3;
    ctx.setLineDash(blocked ? [4, 6] : []);
    ctx.beginPath(); ctx.arc(source.x, source.y, 32 + pulse * 54, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    if (!blocked) {
      for (const targetId of SERVICES) {
        const delta = directive.integrityDelta[targetId];
        if (delta === undefined || delta >= 0) continue;
        const target = pointFor(targetId, w, h);
        const p = (pulse + .15) % 1;
        const x = source.x + (target.x - source.x) * p;
        const y = source.y + (target.y - source.y) * p;
        ctx.fillStyle = "rgba(255, 111, 75, .82)";
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawServices(w: number, h: number, t: number): void {
  if (!view) return;
  for (const id of SERVICES) {
    const p = pointFor(id, w, h);
    const service = view.core.services[id];
    const capacity = view.availability[id];
    const isSelected = id === selected;
    const radius = isSelected ? 34 : 29;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (service.mode === "autonomous") {
      ctx.strokeStyle = `rgba(255, 137, 78, ${.34 + Math.sin(t * 2.4) * .1})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.arc(0, 0, radius + 12, t, t + Math.PI * 1.55); ctx.stroke();
      ctx.setLineDash([]);
    } else if (service.mode === "regulated") {
      ctx.strokeStyle = "rgba(91, 226, 181, .74)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, radius + 10, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = capacity < 3 ? "rgba(92, 34, 31, .94)" : "rgba(12, 33, 42, .96)";
    ctx.strokeStyle = isSelected ? "rgba(229, 244, 242, .95)" : capacity < 4 ? "rgba(255, 157, 94, .75)" : "rgba(104, 190, 187, .58)";
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(234, 245, 242, .94)";
    ctx.font = "700 11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(SERVICE_META[id].short, 0, -3);
    ctx.font = "800 16px system-ui";
    ctx.fillText(`${capacity}/6`, 0, 16);
    if (service.backup) {
      ctx.fillStyle = "rgba(109, 204, 215, .95)";
      ctx.fillRect(radius - 7, -radius + 2, 9, 9);
    }
    if (service.authorityHeld) {
      ctx.strokeStyle = "rgba(238, 219, 120, .95)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, radius - 7, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawPending(w: number, h: number): void {
  if (!view) return;
  for (const pending of view.core.pending) {
    const p = pointFor(pending.target, w, h);
    const rounds = Math.max(0, pending.dueRound - view.core.round);
    ctx.save();
    ctx.translate(p.x + 27, p.y + 31);
    ctx.fillStyle = "rgba(91, 20, 24, .94)";
    ctx.strokeStyle = "rgba(255, 120, 91, .85)";
    ctx.lineWidth = 1;
    roundedRect(-15, -10, 30, 20, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "700 10px system-ui"; ctx.textAlign = "center";
    ctx.fillText(`-${Math.abs(pending.delta)} R${rounds}`, 0, 4);
    ctx.restore();
  }
}

function roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawStrainVignette(w: number, h: number, t: number): void {
  const strain = view?.core.strain ?? 0;
  if (strain < 7) return;
  const ratio = Math.min(1, strain / RULES.constants.strainLossThreshold);
  const alpha = .08 + ratio * .16 + (motionEnabled ? Math.sin(t * 2) * .018 : 0);
  const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .72);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(150, 20, 15, ${alpha})`);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
}

canvas.addEventListener("pointerdown", event => {
  if (!view) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  let nearest: { id: ServiceId; distance: number } | null = null;
  for (const id of SERVICES) {
    const p = pointFor(id, rect.width, rect.height);
    const distance = Math.hypot(x - p.x, y - p.y);
    if (!nearest || distance < nearest.distance) nearest = { id, distance };
  }
  if (nearest && nearest.distance < 55) {
    selected = nearest.id;
    renderServices(); renderSelectedService();
  }
});

must<HTMLButtonElement>("#start-generated").addEventListener("click", () => startSeeded(must<HTMLInputElement>("#seed-input").value));
must<HTMLButtonElement>("#random-seed").addEventListener("click", () => { must<HTMLInputElement>("#seed-input").value = makeSeed(); });
must<HTMLButtonElement>("#resume-game").addEventListener("click", () => { if (pendingResume) resume(pendingResume); });
must<HTMLElement>("#practice-list").innerHTML = SCENARIOS.map(scenario => `<button data-scenario="${scenario.id}"><strong>${escapeHtml(scenario.name)}</strong><small>${escapeHtml(scenario.description)}</small></button>`).join("");
must<HTMLElement>("#practice-list").querySelectorAll<HTMLButtonElement>("[data-scenario]").forEach(button => button.addEventListener("click", () => startAuthored(button.dataset.scenario!)));
must<HTMLButtonElement>("#undo").addEventListener("click", () => dispatch({ type: "undo" }));
must<HTMLButtonElement>("#commit").addEventListener("click", () => dispatch({ type: "commit_round" }));
must<HTMLButtonElement>("#forecast-toggle").addEventListener("click", toggleForecast);
must<HTMLButtonElement>("#help").addEventListener("click", () => helpModal.showModal());
must<HTMLButtonElement>("#start-help").addEventListener("click", () => helpModal.showModal());
must<HTMLButtonElement>("#close-help").addEventListener("click", () => helpModal.close());
must<HTMLButtonElement>("#decline-tool").addEventListener("click", () => dispatch({ type: "choose_tool", tool: null }));
must<HTMLButtonElement>("#result-same").addEventListener("click", restartSame);
must<HTMLButtonElement>("#result-new").addEventListener("click", () => startSeeded());
must<HTMLButtonElement>("#result-menu").addEventListener("click", () => { resultModal.close(); startScreen.classList.remove("hidden"); state = null; view = null; });
must<HTMLButtonElement>("#motion-toggle").addEventListener("click", () => {
  motionEnabled = !motionEnabled && !reducedBySystem;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ motion: motionEnabled })); } catch { /* Optional setting. */ }
  updateMotionButton();
});

loadSettings();
loadResume();
must<HTMLInputElement>("#seed-input").value = makeSeed();
requestAnimationFrame(drawCity);

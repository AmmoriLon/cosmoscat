import {
  CAMERAS,
  CONTRACTS,
  DAY_SEC,
  HULLS,
  MEMORIES,
  ORBITS,
  SAVE_KEY,
  craftLifeSec,
  hullFromSpec,
} from "./data";
import type { Contract, Craft, GameState, PhotoJob, SystemId } from "./types";

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pickContracts(used: string[], count: number): Contract[] {
  const pool = CONTRACTS.filter((c) => !used.includes(c.id));
  const src = pool.length >= count ? pool : CONTRACTS;
  const shuffled = [...src].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((c) => ({
    ...c,
    camera: c.camera ?? "opt",
    status: "offered" as const,
    seed: Math.floor(Math.random() * 1e9),
    cloud: Math.round(8 + Math.random() * 42),
  }));
}

export function normalizeCraft(raw: Partial<Craft>, launchedAt = 0): Craft {
  const orbit = raw.orbit && ORBITS[raw.orbit] ? raw.orbit : "sso535";
  const cameras = Array.isArray(raw.cameras) && raw.cameras.length ? raw.cameras : ["opt"];
  const memory = raw.memory && MEMORIES[raw.memory] ? raw.memory : "bzu1";
  return {
    id: raw.id ?? uid("craft"),
    name: raw.name?.trim() || "Лапка-1",
    orbit,
    cameras,
    memory,
    hull: raw.hull ?? hullFromSpec(orbit, cameras, memory),
    phase: typeof raw.phase === "number" ? raw.phase : 0.4,
    launchedAt: raw.launchedAt ?? launchedAt,
    status: raw.status === "failed" || raw.status === "reentry" ? raw.status : "alive",
    events: Array.isArray(raw.events) ? raw.events : [],
    lifeCut: typeof raw.lifeCut === "number" ? raw.lifeCut : 0,
  };
}

export function makeLapka(launchedAt = 0): Craft {
  return normalizeCraft(
    {
      id: "craft-lapka",
      name: "Лапка-1",
      orbit: "sso535",
      cameras: ["opt"],
      memory: "bzu1",
      hull: "cubesat",
      phase: 0.4,
      status: "alive",
      events: [],
      lifeCut: 0,
    },
    launchedAt,
  );
}

export function nextCraftName(crafts: Craft[]) {
  const n = crafts.length + 1;
  return `Лапка-${n}`;
}

export function freshState(): GameState {
  return {
    version: 3,
    phase: "intro",
    introStep: 0,
    money: 0,
    repairs: { rocket: 0, booster: 0, sat: 0 },
    focused: "rocket",
    opticsLevel: 0,
    operatorsLevel: 0,
    photosSold: 0,
    moneyEarned: 0,
    orbits: 0,
    timeSec: 0,
    tab: "contracts",
    contracts: [],
    jobs: [],
    crafts: [],
    activeCraftId: null,
    workshop: null,
    assembly: null,
    pendingCraft: null,
    log: [
      {
        id: uid("log"),
        t: Date.now(),
        text: "Архив КБ «Мята» открыт. В ангаре — команда и прототип.",
      },
    ],
    launchT: 0,
    seenRadarBrief: false,
  };
}

export function migrateState(raw: Partial<GameState> & { job?: PhotoJob | null }): GameState {
  const base = freshState();
  const { job: legacyJob, ...rest } = raw;
  const merged: GameState = { ...base, ...rest, version: 3 };
  if (!Array.isArray(raw.jobs)) {
    merged.jobs = legacyJob
      ? [{ ...legacyJob, id: legacyJob.id ?? uid("job"), craftId: legacyJob.craftId ?? "craft-lapka" }]
      : [];
  }
  merged.timeSec = raw.timeSec ?? 0;
  if (!Array.isArray(raw.crafts)) {
    if (raw.phase === "ops" || raw.phase === "launch") {
      merged.crafts = [makeLapka(merged.timeSec)];
      merged.activeCraftId = "craft-lapka";
    } else {
      merged.crafts = [];
      merged.activeCraftId = null;
    }
  } else {
    merged.crafts = raw.crafts.map((c) => normalizeCraft(c, merged.timeSec));
  }
  merged.tab = raw.tab === "fleet" ? "fleet" : "contracts";
  merged.workshop = raw.workshop ?? null;
  merged.assembly = raw.assembly
    ? { craft: normalizeCraft(raw.assembly.craft, merged.timeSec), progress: raw.assembly.progress ?? 0 }
    : null;
  merged.pendingCraft = raw.pendingCraft ? normalizeCraft(raw.pendingCraft, merged.timeSec) : null;
  merged.contracts = (merged.contracts ?? []).map((c) => ({ ...c, camera: c.camera ?? "opt" }));
  return merged;
}

export function loadState(): GameState {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshState();
    return migrateState(JSON.parse(raw) as Partial<GameState>);
  } catch {
    return freshState();
  }
}

export function persistState(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function addLog(state: GameState, text: string): GameState {
  return {
    ...state,
    log: [{ id: uid("log"), t: Date.now(), text }, ...state.log].slice(0, 28),
  };
}

export function formatMoney(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.floor(n))} ккр`;
}

export function systemReady(repairs: Record<SystemId, number>) {
  return repairs.rocket >= 100 && repairs.booster >= 100 && repairs.sat >= 100;
}

export function processTime(operatorsLevel: number) {
  return [6.2, 3.4, 1.8][operatorsLevel] ?? 6.2;
}

export function opticsMult(level: number) {
  return [1, 1.35, 1.7][level] ?? 1;
}

export function photoPayout(contract: Contract, opticsLevel: number) {
  const cloudCut = 1 - (contract.cloud / 100) * 0.38;
  const camBonus = contract.camera === "opt" ? 1 : 1.18;
  return Math.round(contract.payout * opticsMult(opticsLevel) * cloudCut * camBonus);
}

export function activeCraft(state: GameState) {
  return state.crafts.find((c) => c.id === state.activeCraftId) ?? null;
}

export function craftSlots(craft: Craft) {
  return MEMORIES[craft.memory].slots;
}

export function craftJobs(state: GameState, craftId: string) {
  return state.jobs.filter((j) => j.craftId === craftId);
}

export function craftLeft(craft: Craft, timeSec: number) {
  if (craft.status === "reentry" || craft.status === "failed") return 0;
  const age = Math.max(0, timeSec - craft.launchedAt);
  return Math.max(0, craftLifeSec(craft.orbit) - craft.lifeCut - age);
}

export function hullLabel(craft: Craft) {
  return HULLS[craft.hull]?.name ?? craft.hull;
}

export function craftStatusLabel(craft: Craft) {
  if (craft.status === "failed") return "отказ";
  if (craft.status === "reentry") return "сгорел";
  return "на орбите";
}

export function formatBureauClock(timeSec: number) {
  const day = Math.floor(timeSec / DAY_SEC) + 1;
  const tod = timeSec % DAY_SEC;
  const h = Math.floor((tod / DAY_SEC) * 24);
  const m = Math.floor((((tod / DAY_SEC) * 24) - h) * 60);
  return `сутки ${day} · ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatSpan(sec: number) {
  const days = Math.floor(sec / DAY_SEC);
  const hours = Math.floor((sec % DAY_SEC) / (DAY_SEC / 24));
  if (sec <= 0) return "сгорел";
  if (days <= 0) return `${Math.max(1, hours)} ч`;
  return `${days} сут ${hours} ч`;
}

export function cameraLabel(ids: Craft["cameras"]) {
  return ids.map((id) => CAMERAS[id].short).join(" · ");
}

export function orbitLabel(id: Craft["orbit"]) {
  const o = ORBITS[id];
  return `${o.name} · ${o.kind}`;
}

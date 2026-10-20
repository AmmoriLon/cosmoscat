import { CONTRACTS, SAVE_KEY } from "./data";
import type { Contract, GameState, SystemId } from "./types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pickContracts(used: string[], count: number): Contract[] {
  const pool = CONTRACTS.filter((c) => !used.includes(c.id));
  const src = pool.length >= count ? pool : CONTRACTS;
  const shuffled = [...src].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((c) => ({
    ...c,
    status: "offered" as const,
    seed: Math.floor(Math.random() * 1e9),
    cloud: Math.round(8 + Math.random() * 42),
  }));
}

export function freshState(): GameState {
  return {
    version: 1,
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
    contracts: [],
    job: null,
    log: [
      {
        id: uid("log"),
        t: Date.now(),
        text: "Архив КБ открыт. В ангаре — списанный носитель и отдел инженеров.",
      },
    ],
    launchT: 0,
    seenRadarBrief: false,
  };
}

export function loadState(): GameState {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== 1) return freshState();
    return { ...freshState(), ...parsed, version: 1 };
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
    log: [{ id: uid("log"), t: Date.now(), text }, ...state.log].slice(0, 24),
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
  return Math.round(contract.payout * opticsMult(opticsLevel) * cloudCut);
}

"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  EARTH_DAY_S,
  ENGINEER_REPAIR_PER_S,
  ORBIT_PERIOD_S,
  PPIS,
  TAP_REPAIR,
  UPGRADES,
} from "./data";
import {
  approachIds,
  eciToLatLon,
  imagingIds,
  ppiInView,
  satEci,
} from "./orbit";
import {
  addLog,
  clearSave,
  freshState,
  loadState,
  persistState,
  photoPayout,
  pickContracts,
  processTime,
  systemReady,
} from "./save";
import type { GameState, SimSnapshot, SystemId } from "./types";

type Action =
  | { type: "HYDRATE"; state: GameState }
  | { type: "INTRO_NEXT" }
  | { type: "SKIP_INTRO" }
  | { type: "FOCUS"; id: SystemId }
  | { type: "TAP_REPAIR" }
  | { type: "REPAIR_TICK"; dt: number }
  | { type: "START_LAUNCH" }
  | { type: "LAUNCH_TICK"; dt: number }
  | { type: "ACCEPT"; id: string }
  | { type: "SHOOT"; id: string }
  | { type: "JOB_TICK"; dt: number; ppiIds: string[] }
  | { type: "SELL" }
  | { type: "BUY_OPTICS" }
  | { type: "BUY_OPS" }
  | { type: "ORBIT" }
  | { type: "RESET" };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "INTRO_NEXT": {
      if (state.introStep >= 3) return { ...state, phase: "hangar" };
      return { ...state, introStep: state.introStep + 1 };
    }
    case "SKIP_INTRO":
      return { ...state, phase: "hangar", introStep: 3 };
    case "FOCUS":
      return { ...state, focused: action.id };
    case "TAP_REPAIR": {
      if (state.phase !== "hangar") return state;
      const cur = state.repairs[state.focused];
      if (cur >= 100) return state;
      const next = Math.min(100, cur + TAP_REPAIR);
      const repairs = { ...state.repairs, [state.focused]: next };
      let nextState = { ...state, repairs };
      if (cur < 100 && next >= 100) {
        const names = { rocket: "Камыш-2", booster: "Ласточка-Б", sat: "Лапка-1" };
        nextState = addLog(nextState, `${names[state.focused]} принят отделом. Готов к вывозу.`);
      }
      return nextState;
    }
    case "REPAIR_TICK": {
      if (state.phase !== "hangar") return state;
      const repairs = { ...state.repairs };
      (Object.keys(repairs) as SystemId[]).forEach((id) => {
        repairs[id] = Math.min(100, repairs[id] + ENGINEER_REPAIR_PER_S * action.dt);
      });
      return { ...state, repairs };
    }
    case "START_LAUNCH":
      if (!systemReady(state.repairs) || state.phase !== "hangar") return state;
      return addLog(
        { ...state, phase: "launch", launchT: 0 },
        "Вывоз на старт. Расчёт выведения на ССО 535 км открыт.",
      );
    case "LAUNCH_TICK": {
      if (state.phase !== "launch") return state;
      const t = state.launchT + action.dt;
      if (t >= 11.4) {
        return addLog(
          {
            ...state,
            phase: "ops",
            launchT: t,
            orbits: 1,
            contracts: pickContracts([], 3),
          },
          "«Лапка-1» на рабочем витке. Ждём заявки. Память бортовая — один кадр.",
        );
      }
      return { ...state, launchT: t };
    }
    case "ACCEPT": {
      const contracts = state.contracts.map((c) =>
        c.id === action.id && c.status === "offered" ? { ...c, status: "active" as const } : c,
      );
      const c = state.contracts.find((x) => x.id === action.id);
      return addLog({ ...state, contracts }, c ? `${c.client} передала координаты. Ставь в план съёмки.` : "Заявка принята.");
    }
    case "SHOOT": {
      if (state.job) return state;
      const c = state.contracts.find((x) => x.id === action.id && x.status === "active");
      if (!c) return state;
      return addLog(
        {
          ...state,
          job: { contractId: c.id, stage: "onboard", progress: 0, capturedAt: Date.now() },
          contracts: state.contracts.map((x) => (x.id === c.id ? { ...x, status: "pipeline" as const } : x)),
        },
        `Затвор. Сырой кадр «${c.title}» на борту. Ждём зону ППИ.`,
      );
    }
    case "JOB_TICK": {
      if (!state.job) return state;
      const job = { ...state.job };
      if (job.stage === "onboard") {
        const hit = action.ppiIds[0];
        if (hit) {
          job.stage = "downlink";
          job.progress = 0;
          job.ppiId = hit;
        }
      } else if (job.stage === "downlink") {
        if (!job.ppiId || action.ppiIds.includes(job.ppiId)) {
          job.progress = Math.min(1, job.progress + action.dt / 2.6);
          if (job.progress >= 1) {
            job.stage = "processing";
            job.progress = 0;
          }
        }
      } else if (job.stage === "processing") {
        job.progress = Math.min(1, job.progress + action.dt / processTime(state.operatorsLevel));
        if (job.progress >= 1) {
          job.stage = "ready";
          job.progress = 1;
        }
      }
      return { ...state, job };
    }
    case "SELL": {
      if (!state.job || state.job.stage !== "ready") return state;
      const c = state.contracts.find((x) => x.id === state.job?.contractId);
      if (!c) return { ...state, job: null };
      const pay = photoPayout(c, state.opticsLevel);
      const used = state.contracts.map((x) => x.id);
      const replacement = pickContracts(used, 1);
      const contracts = [
        ...state.contracts.filter((x) => x.id !== c.id),
        ...replacement,
      ];
      let next = addLog(
        {
          ...state,
          job: null,
          money: state.money + pay,
          moneyEarned: state.moneyEarned + pay,
          photosSold: state.photosSold + 1,
          contracts,
        },
        `Продали «${c.title}» за ${pay} ккр. Операторы уже ждут следующий поток.`,
      );
      if (!next.seenRadarBrief && next.photosSold >= 4) {
        next = addLog(
          { ...next, seenRadarBrief: true },
          "Президент: оптика слепнет в облаках. Когда будет бюджет — начнём «Ирбис». Радар, не завтра.",
        );
      }
      return next;
    }
    case "BUY_OPTICS": {
      const nextLevel = state.opticsLevel + 1;
      const offer = UPGRADES.optics[nextLevel - 1];
      if (!offer || state.money < offer.cost) return state;
      return addLog(
        { ...state, money: state.money - offer.cost, opticsLevel: nextLevel },
        `${offer.title}. Новый ГСД в паспорте КА.`,
      );
    }
    case "BUY_OPS": {
      const nextLevel = state.operatorsLevel + 1;
      const offer = UPGRADES.operators[nextLevel - 1];
      if (!offer || state.money < offer.cost) return state;
      return addLog(
        { ...state, money: state.money - offer.cost, operatorsLevel: nextLevel },
        `${offer.title}. Контур L1 ускорен.`,
      );
    }
    case "ORBIT":
      return { ...state, orbits: state.orbits + 1 };
    case "RESET":
      return freshState();
    default:
      return state;
  }
}

const EMPTY_SIM: SimSnapshot = {
  anomaly: 0.4,
  earthAngle: 0.2,
  satLat: 0,
  satLon: 0,
  inImaging: [],
  approaching: [],
  inPpi: [],
};

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const simRef = useRef<SimSnapshot>({ ...EMPTY_SIM });
  const [sim, setSim] = useState<SimSnapshot>(EMPTY_SIM);
  const prevAnomaly = useRef(0);
  const stateRef = useRef(state);
  const boots = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    boots.current += 1;
    if (boots.current === 1) {
      dispatch({ type: "HYDRATE", state: loadState() });
      return;
    }
    persistState(state);
  }, [state]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s.phase === "ops") {
        const snap = simRef.current;
        snap.anomaly = (snap.anomaly + (dt * Math.PI * 2) / ORBIT_PERIOD_S) % (Math.PI * 2);
        snap.earthAngle = (snap.earthAngle + (dt * Math.PI * 2) / EARTH_DAY_S) % (Math.PI * 2);
        const p = satEci(snap.anomaly);
        const ll = eciToLatLon(p.x, p.y, p.z, snap.earthAngle);
        snap.satLat = ll.lat;
        snap.satLon = ll.lon;
        const active = s.contracts.filter((c) => c.status === "active");
        snap.inImaging = imagingIds(ll.lat, ll.lon, active);
        snap.approaching = approachIds(ll.lat, ll.lon, active);
        snap.inPpi = ppiInView(ll.lat, ll.lon, PPIS);
      }
      acc += dt;
      if (acc >= 0.1) {
        const step = acc;
        acc = 0;
        if (s.phase === "hangar") dispatch({ type: "REPAIR_TICK", dt: step });
        if (s.phase === "launch") dispatch({ type: "LAUNCH_TICK", dt: step });
        if (s.phase === "ops") {
          const snap = simRef.current;
          if (snap.anomaly < prevAnomaly.current) dispatch({ type: "ORBIT" });
          prevAnomaly.current = snap.anomaly;
          if (s.job) dispatch({ type: "JOB_TICK", dt: step, ppiIds: snap.inPpi });
          setSim({ ...snap });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tap = useCallback(() => {
    dispatch({ type: "TAP_REPAIR" });
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
  }, []);

  const shoot = useCallback((id: string) => {
    dispatch({ type: "SHOOT", id });
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(16);
  }, []);

  const reset = useCallback(() => {
    clearSave();
    dispatch({ type: "RESET" });
    simRef.current = { ...EMPTY_SIM };
    setSim({ ...EMPTY_SIM });
  }, []);

  const actions = useMemo(
    () => ({
      introNext: () => dispatch({ type: "INTRO_NEXT" }),
      skipIntro: () => dispatch({ type: "SKIP_INTRO" }),
      focus: (id: SystemId) => dispatch({ type: "FOCUS", id }),
      tap,
      startLaunch: () => dispatch({ type: "START_LAUNCH" }),
      accept: (id: string) => dispatch({ type: "ACCEPT", id }),
      shoot,
      sell: () => dispatch({ type: "SELL" }),
      buyOptics: () => dispatch({ type: "BUY_OPTICS" }),
      buyOps: () => dispatch({ type: "BUY_OPS" }),
      reset,
    }),
    [reset, shoot, tap],
  );

  return { ready: true, state, sim, simRef, actions };
}

export type GameApi = ReturnType<typeof useGame>;

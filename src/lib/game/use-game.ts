"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  EARTH_DAY_S,
  ENGINEER_REPAIR_PER_S,
  LAUNCH_END_S,
  ORBITS,
  PPIS,
  TAP_REPAIR,
  UPGRADES,
  buildCost,
  emptyWorkshop,
} from "./data";
import {
  approachIds,
  eciToLatLon,
  imagingIds,
  orbitCanSee,
  ppiInView,
  satEci,
} from "./orbit";
import {
  activeCraft,
  addLog,
  clearSave,
  craftJobs,
  craftLeft,
  craftSlots,
  freshState,
  loadState,
  makeLapka,
  nextCraftName,
  persistState,
  photoPayout,
  pickContracts,
  processTime,
  systemReady,
  uid,
} from "./save";
import type { Craft, GameState, MemoryId, OpsTab, OrbitId, SimSnapshot, SystemId, WorkshopDraft } from "./types";

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
  | { type: "SELL"; jobId: string }
  | { type: "BUY_OPTICS" }
  | { type: "BUY_OPS" }
  | { type: "ORBIT" }
  | { type: "TIME"; dt: number }
  | { type: "SET_TAB"; tab: OpsTab }
  | { type: "SELECT_CRAFT"; id: string }
  | { type: "OPEN_WORKSHOP" }
  | { type: "CLOSE_WORKSHOP" }
  | { type: "EDIT_WORKSHOP"; draft: Partial<WorkshopDraft> }
  | { type: "COMMIT_BUILD" }
  | { type: "RESET" };

function applyReentries(state: GameState): GameState {
  let next = state;
  const crafts = state.crafts.map((c) => {
    if (c.status === "alive" && craftLeft(c, state.timeSec) <= 0) {
      next = addLog(next, `«${c.name}» вошёл в атмосферу и сгорел. Срок вышел.`);
      return { ...c, status: "reentry" as const };
    }
    return c;
  });
  if (crafts.every((c, i) => c === state.crafts[i])) return state;
  const alive = crafts.filter((c) => c.status === "alive");
  const activeStill = crafts.find((c) => c.id === state.activeCraftId && c.status === "alive");
  return {
    ...next,
    crafts,
    activeCraftId: activeStill?.id ?? alive[0]?.id ?? null,
    jobs: next.jobs.filter((j) => {
      const host = crafts.find((c) => c.id === j.craftId);
      if (host?.status === "reentry" && j.stage !== "ready") return false;
      return true;
    }),
  };
}

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
        { ...state, phase: "launch", launchT: 0, pendingCraft: makeLapka(state.timeSec) },
        "Вывоз на старт. Расчёт выведения на ССО 535 км открыт.",
      );
    case "LAUNCH_TICK": {
      if (state.phase !== "launch") return state;
      const t = state.launchT + action.dt;
      if (t >= LAUNCH_END_S) {
        const craft = state.pendingCraft ?? makeLapka(state.timeSec);
        const already = state.crafts.some((c) => c.id === craft.id);
        const crafts = already ? state.crafts : [...state.crafts, { ...craft, launchedAt: state.timeSec, status: "alive" as const }];
        return addLog(
          {
            ...state,
            phase: "ops",
            launchT: t,
            orbits: Math.max(1, state.orbits),
            contracts: state.contracts.length ? state.contracts : pickContracts([], 3),
            crafts,
            activeCraftId: craft.id,
            pendingCraft: null,
            tab: "contracts",
          },
          `«${craft.name}» на рабочем витке. БЗУ ${craftSlots(craft)} кадр., ${ORBITS[craft.orbit].name}.`,
        );
      }
      return { ...state, launchT: t };
    }
    case "ACCEPT": {
      const craft = activeCraft(state);
      const c = state.contracts.find((x) => x.id === action.id);
      if (!c || c.status !== "offered") return state;
      if (!craft || craft.status !== "alive") {
        return addLog(state, "Нет живого КА. Собери новый в аппаратах.");
      }
      if (!craft.cameras.includes(c.camera)) {
        return addLog(state, `«${craft.name}» не несёт нужный канал. Нужна другая камера.`);
      }
      if (!orbitCanSee(craft.orbit, c.lat)) {
        return addLog(state, `Эта орбита не берёт ${c.title}. Широта вне полосы.`);
      }
      const contracts = state.contracts.map((x) =>
        x.id === action.id ? { ...x, status: "active" as const } : x,
      );
      return addLog({ ...state, contracts }, `${c.client} передала координаты. Ставь в план съёмки.`);
    }
    case "SHOOT": {
      const craft = activeCraft(state);
      const c = state.contracts.find((x) => x.id === action.id && x.status === "active");
      if (!c || !craft || craft.status !== "alive") return state;
      if (!craft.cameras.includes(c.camera)) return state;
      if (craftJobs(state, craft.id).length >= craftSlots(craft)) {
        return addLog(state, `БЗУ «${craft.name}» полно. Сбрось или продай кадр.`);
      }
      const job = {
        id: uid("job"),
        craftId: craft.id,
        contractId: c.id,
        stage: "onboard" as const,
        progress: 0,
        capturedAt: Date.now(),
      };
      return addLog(
        {
          ...state,
          jobs: [...state.jobs, job],
          contracts: state.contracts.map((x) => (x.id === c.id ? { ...x, status: "pipeline" as const } : x)),
        },
        `Затвор «${craft.name}». Сырой кадр «${c.title}» на борту.`,
      );
    }
    case "JOB_TICK": {
      if (!state.jobs.length) return state;
      const jobs = state.jobs.map((job) => {
        const next = { ...job };
        if (next.stage === "onboard") {
          const hit = action.ppiIds[0];
          if (hit) {
            next.stage = "downlink";
            next.progress = 0;
            next.ppiId = hit;
          }
        } else if (next.stage === "downlink") {
          if (!next.ppiId || action.ppiIds.includes(next.ppiId)) {
            next.progress = Math.min(1, next.progress + action.dt / 2.6);
            if (next.progress >= 1) {
              next.stage = "processing";
              next.progress = 0;
            }
          }
        } else if (next.stage === "processing") {
          next.progress = Math.min(1, next.progress + action.dt / processTime(state.operatorsLevel));
          if (next.progress >= 1) {
            next.stage = "ready";
            next.progress = 1;
          }
        }
        return next;
      });
      return { ...state, jobs };
    }
    case "SELL": {
      const job = state.jobs.find((j) => j.id === action.jobId && j.stage === "ready");
      if (!job) return state;
      const c = state.contracts.find((x) => x.id === job.contractId);
      if (!c) return { ...state, jobs: state.jobs.filter((j) => j.id !== job.id) };
      const pay = photoPayout(c, state.opticsLevel);
      const used = state.contracts.map((x) => x.id);
      const replacement = pickContracts(used, 1);
      const contracts = [...state.contracts.filter((x) => x.id !== c.id), ...replacement];
      let next = addLog(
        {
          ...state,
          jobs: state.jobs.filter((j) => j.id !== job.id),
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
    case "TIME": {
      if (state.phase !== "ops") return state;
      return applyReentries({ ...state, timeSec: state.timeSec + action.dt });
    }
    case "SET_TAB":
      return { ...state, tab: action.tab };
    case "SELECT_CRAFT":
      return { ...state, activeCraftId: action.id, tab: "contracts" };
    case "OPEN_WORKSHOP":
      return { ...state, tab: "fleet", workshop: emptyWorkshop(nextCraftName(state.crafts)) };
    case "CLOSE_WORKSHOP":
      return { ...state, workshop: null };
    case "EDIT_WORKSHOP": {
      if (!state.workshop) return state;
      const draft = { ...state.workshop, ...action.draft };
      if (action.draft.cameras) {
        draft.cameras = action.draft.cameras.length ? action.draft.cameras : ["opt"];
      }
      return { ...state, workshop: draft };
    }
    case "COMMIT_BUILD": {
      if (!state.workshop) return state;
      const draft = state.workshop;
      const name = draft.name.trim().slice(0, 22);
      if (name.length < 2) return addLog(state, "Дай аппарату имя — хотя бы два знака.");
      if (!draft.cameras.length) return state;
      const cost = buildCost(draft);
      if (state.money < cost) return addLog(state, `Не хватает ${cost - state.money} ккр на сборку.`);
      const craft: Craft = {
        id: uid("craft"),
        name,
        orbit: draft.orbit,
        cameras: draft.cameras,
        memory: draft.memory,
        launchedAt: state.timeSec,
        status: "alive",
      };
      return addLog(
        {
          ...state,
          money: state.money - cost,
          workshop: null,
          pendingCraft: craft,
          phase: "launch",
          launchT: 0,
        },
        `Сборка «${name}» закрыта. ${formatBuildLine(draft)} Вывоз на старт.`,
      );
    }
    case "RESET":
      return freshState();
    default:
      return state;
  }
}

function formatBuildLine(draft: WorkshopDraft) {
  return `${ORBITS[draft.orbit].name}, ${draft.cameras.join("/")}, ${draft.memory}.`;
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
        const craft = activeCraft(s);
        const orbitId = craft?.orbit ?? "sso535";
        const period = ORBITS[orbitId].period;
        const snap = simRef.current;
        snap.anomaly = (snap.anomaly + (dt * Math.PI * 2) / period) % (Math.PI * 2);
        snap.earthAngle = (snap.earthAngle + (dt * Math.PI * 2) / EARTH_DAY_S) % (Math.PI * 2);
        const p = satEci(snap.anomaly, orbitId);
        const ll = eciToLatLon(p.x, p.y, p.z, snap.earthAngle);
        snap.satLat = ll.lat;
        snap.satLon = ll.lon;
        const active = s.contracts.filter((c) => c.status === "active");
        snap.inImaging = imagingIds(ll.lat, ll.lon, active, orbitId);
        snap.approaching = approachIds(ll.lat, ll.lon, active, orbitId);
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
          dispatch({ type: "TIME", dt: step });
          if (s.jobs.length) dispatch({ type: "JOB_TICK", dt: step, ppiIds: snap.inPpi });
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
      sell: (jobId: string) => dispatch({ type: "SELL", jobId }),
      buyOptics: () => dispatch({ type: "BUY_OPTICS" }),
      buyOps: () => dispatch({ type: "BUY_OPS" }),
      setTab: (tab: OpsTab) => dispatch({ type: "SET_TAB", tab }),
      selectCraft: (id: string) => dispatch({ type: "SELECT_CRAFT", id }),
      openWorkshop: () => dispatch({ type: "OPEN_WORKSHOP" }),
      closeWorkshop: () => dispatch({ type: "CLOSE_WORKSHOP" }),
      editWorkshop: (draft: Partial<WorkshopDraft>) => dispatch({ type: "EDIT_WORKSHOP", draft }),
      toggleCamera: (id: WorkshopDraft["cameras"][number]) => {
        const cur = stateRef.current.workshop?.cameras ?? ["opt"];
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        dispatch({ type: "EDIT_WORKSHOP", draft: { cameras: next } });
      },
      setOrbit: (orbit: OrbitId) => dispatch({ type: "EDIT_WORKSHOP", draft: { orbit } }),
      setMemory: (memory: MemoryId) => dispatch({ type: "EDIT_WORKSHOP", draft: { memory } }),
      commitBuild: () => dispatch({ type: "COMMIT_BUILD" }),
      reset,
    }),
    [reset, shoot, tap],
  );

  return { ready: true, state, sim, simRef, actions };
}

export type GameApi = ReturnType<typeof useGame>;

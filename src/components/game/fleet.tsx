"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CAMERAS, HULLS, MEMORIES, ORBITS, buildCost, hullFromSpec } from "@/lib/game/data";
import {
  activeCraft,
  cameraLabel,
  craftJobs,
  craftLeft,
  craftSlots,
  craftStatusLabel,
  formatMoney,
  formatSpan,
  hullLabel,
  orbitLabel,
} from "@/lib/game/save";
import type { CameraId, GameState, MemoryId, OrbitId } from "@/lib/game/types";

export function FleetPanel({
  state,
  onInspect,
  onSelect,
  onOpenWorkshop,
  onCloseWorkshop,
  onName,
  onOrbit,
  onMemory,
  onToggleCamera,
  onCommit,
  onTapAssemble,
}: {
  state: GameState;
  onInspect: (id: string) => void;
  onSelect: (id: string) => void;
  onOpenWorkshop: () => void;
  onCloseWorkshop: () => void;
  onName: (name: string) => void;
  onOrbit: (id: OrbitId) => void;
  onMemory: (id: MemoryId) => void;
  onToggleCamera: (id: CameraId) => void;
  onCommit: () => void;
  onTapAssemble: () => void;
}) {
  if (state.workshop) {
    return (
      <Workshop
        state={state}
        onName={onName}
        onOrbit={onOrbit}
        onMemory={onMemory}
        onToggleCamera={onToggleCamera}
        onCommit={onCommit}
        onClose={onCloseWorkshop}
      />
    );
  }

  if (state.assembly) {
    return <AssemblyBay state={state} onTap={onTapAssemble} />;
  }

  const active = activeCraft(state);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-24 pt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg">Космические аппараты</p>
          <p className="text-xs text-zinc-500">
            {state.crafts.filter((c) => c.status === "alive").length} на орбите
            {active ? ` · в работе «${active.name}»` : ""}
          </p>
        </div>
        <Button size="sm" onClick={onOpenWorkshop}>
          Собрать КА
        </Button>
      </div>

      {state.crafts.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#121826]/70 p-4 text-sm text-zinc-400">
          Флот пуст. Первый прототип ещё в ангаре — или собери новый за ккр.
        </p>
      ) : null}

      <div className="grid gap-2">
        {state.crafts.map((craft) => {
          const left = craftLeft(craft, state.timeSec);
          const used = craftJobs(state, craft.id).length;
          const slots = craftSlots(craft);
          const selected = state.activeCraftId === craft.id;
          const dead = craft.status !== "alive";
          const alarm = craft.events.length > 0 && !dead;
          return (
            <div
              key={craft.id}
              className={`rounded-2xl border p-3 ${
                dead
                  ? "border-white/5 bg-[#121826]/40 opacity-70"
                  : alarm
                    ? "border-red-400/40 bg-red-500/8"
                    : selected
                      ? "border-copper/70 bg-copper/10"
                      : "border-white/10 bg-[#121826]/70"
              }`}
            >
              <button type="button" onClick={() => onInspect(craft.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-[15px]">{craft.name}</p>
                    <p className="font-mono text-[10px] text-teal/80">
                      {orbitLabel(craft.orbit)} · {hullLabel(craft)}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {dead ? craftStatusLabel(craft) : selected ? "в работе" : "на орбите"}
                  </p>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                  <div>
                    <dt className="text-zinc-600">Съёмка</dt>
                    <dd>{cameraLabel(craft.cameras)}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">БЗУ</dt>
                    <dd>
                      {used}/{slots} кадр.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Срок</dt>
                    <dd>{dead ? craftStatusLabel(craft) : `ещё ${formatSpan(left)}`}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Накл.</dt>
                    <dd>{ORBITS[craft.orbit].inc}°</dd>
                  </div>
                </dl>
                {alarm ? (
                  <p className="mt-2 text-[11px] text-red-300">
                    {craft.events[craft.events.length - 1]?.title}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[10px] text-zinc-600">тап — телеметрия</p>
              </button>
              {!dead && !selected ? (
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => onSelect(craft.id)}>
                  Вести этот КА
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssemblyBay({ state, onTap }: { state: GameState; onTap: () => void }) {
  const a = state.assembly;
  if (!a) return null;
  const craft = a.craft;
  const hull = HULLS[craft.hull];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 pb-24 pt-3">
      <div>
        <p className="font-heading text-lg">Сборка «{craft.name}»</p>
        <p className="text-xs text-zinc-500">
          Инженеры паяют сами. Тап ускоряет закладку корпуса, панелей и БЗУ.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
        <p className="font-mono text-[11px] text-teal">{hull.name}</p>
        <p className="mt-1 text-sm text-zinc-300">
          {ORBITS[craft.orbit].name} · {cameraLabel(craft.cameras)} · {MEMORIES[craft.memory].name}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>Готовность</span>
          <span className="font-mono text-copper">{Math.floor(a.progress)}%</span>
        </div>
        <Progress value={a.progress} className="mt-1 gap-0" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Корпус", "Панели", "Камеры", "БЗУ", "Радио"].map((chip, i) => {
            const on = a.progress >= (i + 1) * 20;
            return (
              <span
                key={chip}
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                  on ? "bg-teal/15 text-teal" : "bg-white/5 text-zinc-500"
                }`}
              >
                {chip}
              </span>
            );
          })}
        </div>
      </div>

      <Button className="tap-btn h-16 w-full text-lg" onClick={onTap}>
        Паять · {craft.name}
      </Button>
      <p className="text-center text-xs text-zinc-500">На 100% аппарат сам уедет на старт.</p>
    </div>
  );
}

function Workshop({
  state,
  onName,
  onOrbit,
  onMemory,
  onToggleCamera,
  onCommit,
  onClose,
}: {
  state: GameState;
  onName: (name: string) => void;
  onOrbit: (id: OrbitId) => void;
  onMemory: (id: MemoryId) => void;
  onToggleCamera: (id: CameraId) => void;
  onCommit: () => void;
  onClose: () => void;
}) {
  const draft = state.workshop;
  if (!draft) return null;
  const cost = buildCost(draft);
  const can = state.money >= cost && draft.name.trim().length >= 2;
  const hull = hullFromSpec(draft.orbit, draft.cameras, draft.memory);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 pb-40 pt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg">Новый аппарат</p>
          <p className="text-xs text-zinc-500">
            Плата сразу. Сборка не мгновенная — потом паяем и только после этого старт.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Назад
        </Button>
      </div>

      <label className="grid gap-1 text-xs text-zinc-500">
        Имя КА
        <input
          value={draft.name}
          onChange={(e) => onName(e.target.value)}
          maxLength={22}
          className="h-11 rounded-xl border border-white/10 bg-[#0d121c] px-3 text-sm text-zinc-100 outline-none focus:border-copper/60"
          placeholder="Лапка-2"
        />
      </label>

      <p className="rounded-xl border border-white/10 bg-[#121826]/70 px-3 py-2 text-xs text-zinc-400">
        Корпус: <span className="text-zinc-200">{HULLS[hull].name}</span> — модель на орбите зависит от
        камер, орбиты и БЗУ.
      </p>

      <section>
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">Орбита</p>
        <div className="grid gap-2">
          {(Object.keys(ORBITS) as OrbitId[]).map((id) => {
            const o = ORBITS[id];
            const on = draft.orbit === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOrbit(id)}
                className={`rounded-2xl border p-3 text-left ${
                  on ? "border-copper/70 bg-copper/10" : "border-white/10 bg-[#121826]/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{o.name}</p>
                  <p className="font-mono text-[11px] text-copper">{formatMoney(o.cost)}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{o.blurb}</p>
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                  {o.kind} · жизнь {o.lifeDays} сут · до {o.maxLat}° ш.
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">Камеры</p>
        <div className="grid gap-2">
          {(Object.keys(CAMERAS) as CameraId[]).map((id) => {
            const cam = CAMERAS[id];
            const on = draft.cameras.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleCamera(id)}
                className={`rounded-2xl border p-3 text-left ${
                  on ? "border-teal/60 bg-teal/10" : "border-white/10 bg-[#121826]/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    {cam.name} · {cam.short}
                  </p>
                  <p className="font-mono text-[11px] text-copper">
                    {cam.cost ? formatMoney(cam.cost) : "в базе"}
                  </p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{cam.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">БЗУ</p>
        <div className="grid gap-2">
          {(Object.keys(MEMORIES) as MemoryId[]).map((id) => {
            const m = MEMORIES[id];
            const on = draft.memory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onMemory(id)}
                className={`rounded-2xl border p-3 text-left ${
                  on ? "border-copper/70 bg-copper/10" : "border-white/10 bg-[#121826]/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="font-mono text-[11px] text-copper">{m.cost ? formatMoney(m.cost) : "в базе"}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{m.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="h-2" />
      <div className="sticky bottom-20 rounded-2xl border border-white/10 bg-[#0e1420]/95 p-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Закладка</span>
          <span className="font-mono text-copper">{formatMoney(cost)}</span>
        </div>
        <Button className="h-12 w-full" disabled={!can} onClick={onCommit}>
          {can ? "Оплатить и начать сборку" : "Не хватает имени или ккр"}
        </Button>
      </div>
    </div>
  );
}

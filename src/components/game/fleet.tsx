"use client";

import { Button } from "@/components/ui/button";
import { CAMERAS, MEMORIES, ORBITS, buildCost } from "@/lib/game/data";
import {
  activeCraft,
  cameraLabel,
  craftJobs,
  craftLeft,
  craftSlots,
  formatMoney,
  formatSpan,
  orbitLabel,
} from "@/lib/game/save";
import type { CameraId, GameState, MemoryId, OrbitId } from "@/lib/game/types";

export function FleetPanel({
  state,
  onSelect,
  onOpenWorkshop,
  onCloseWorkshop,
  onName,
  onOrbit,
  onMemory,
  onToggleCamera,
  onCommit,
}: {
  state: GameState;
  onSelect: (id: string) => void;
  onOpenWorkshop: () => void;
  onCloseWorkshop: () => void;
  onName: (name: string) => void;
  onOrbit: (id: OrbitId) => void;
  onMemory: (id: MemoryId) => void;
  onToggleCamera: (id: CameraId) => void;
  onCommit: () => void;
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
          const dead = craft.status === "reentry";
          return (
            <button
              key={craft.id}
              type="button"
              onClick={() => !dead && onSelect(craft.id)}
              className={`rounded-2xl border p-3 text-left ${
                dead
                  ? "border-white/5 bg-[#121826]/40 opacity-70"
                  : selected
                    ? "border-copper/70 bg-copper/10"
                    : "border-white/10 bg-[#121826]/70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-[15px]">{craft.name}</p>
                  <p className="font-mono text-[10px] text-teal/80">{orbitLabel(craft.orbit)}</p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {dead ? "сгорел" : selected ? "в работе" : "на орбите"}
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
                  <dd>{dead ? "атмосфера" : `ещё ${formatSpan(left)}`}</dd>
                </div>
                <div>
                  <dt className="text-zinc-600">Накл.</dt>
                  <dd>{ORBITS[craft.orbit].inc}°</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 pb-24 pt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg">Новый аппарат</p>
          <p className="text-xs text-zinc-500">Плата за платформу, орбиту, камеры и БЗУ. Потом — старт.</p>
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

      <div className="sticky bottom-20 rounded-2xl border border-white/10 bg-[#0e1420] p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Сборка</span>
          <span className="font-mono text-copper">{formatMoney(cost)}</span>
        </div>
        <Button className="h-12 w-full" disabled={!can} onClick={onCommit}>
          {can ? "Собрать и вывезти на старт" : "Не хватает имени или ккр"}
        </Button>
      </div>
    </div>
  );
}

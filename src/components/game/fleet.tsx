"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const flying = state.crafts.filter((craft) => craft.status === "alive");
  const archived = state.crafts.filter((craft) => craft.status !== "alive");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-24 pt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg">Космические аппараты</p>
          <p className="text-xs text-zinc-500">
            {flying.length} на орбите
            {active ? ` · в работе «${active.name}»` : ""}
          </p>
        </div>
        <Button size="sm" onClick={onOpenWorkshop}>
          Собрать КА
        </Button>
      </div>

      {flying.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#121826]/70 p-4 text-sm text-zinc-400">
          На орбите пусто. Первый прототип ещё в ангаре — или собери новый за ккр.
        </p>
      ) : null}

      <div className="grid gap-2">
        {flying.map((craft) => (
          <CraftCard
            key={craft.id}
            craft={craft}
            state={state}
            selected={state.activeCraftId === craft.id}
            archived={false}
            onInspect={onInspect}
            onSelect={onSelect}
          />
        ))}
      </div>

      {archived.length ? (
        <section className="mt-2 grid gap-2">
          <div>
            <p className="font-heading text-base">Архив</p>
            <p className="text-xs text-zinc-500">Списанные аппараты. Аварий и всплывашек по ним больше нет.</p>
          </div>
          {archived.map((craft) => (
            <CraftCard
              key={craft.id}
              craft={craft}
              state={state}
              selected={false}
              archived
              onInspect={onInspect}
              onSelect={onSelect}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function CraftCard({
  craft,
  state,
  selected,
  archived,
  onInspect,
  onSelect,
}: {
  craft: GameState["crafts"][number];
  state: GameState;
  selected: boolean;
  archived: boolean;
  onInspect: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const left = craftLeft(craft, state.timeSec);
  const used = craftJobs(state, craft.id).length;
  const slots = craftSlots(craft);
  const broken = craft.status === "failed";
  const alarm = !archived && craft.events.length > 0;
  return (
    <div
      className={`rounded-2xl border p-3 ${
        archived
          ? "border-white/5 bg-[#121826]/40 opacity-80"
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
            <p className="flex items-center gap-1.5 font-heading text-[15px]">
              {craft.name}
              {broken ? (
                <AlertTriangle className="size-4 text-red-400" aria-label="вышел из строя" />
              ) : alarm ? (
                <AlertTriangle className="size-4 animate-pulse text-red-300" aria-label="выходит из строя" />
              ) : null}
            </p>
            <p className="font-mono text-[10px] text-teal/80">
              {orbitLabel(craft.orbit)} · {hullLabel(craft)}
            </p>
          </div>
          <p className={`font-mono text-[10px] uppercase tracking-wider ${broken ? "text-red-300" : "text-zinc-500"}`}>
            {archived ? craftStatusLabel(craft) : selected ? "в работе" : "на орбите"}
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
            <dd>{archived ? craftStatusLabel(craft) : `ещё ${formatSpan(left)}`}</dd>
          </div>
          <div>
            <dt className="text-zinc-600">Накл.</dt>
            <dd>{ORBITS[craft.orbit].inc}°</dd>
          </div>
        </dl>
        {alarm ? (
          <p className="mt-2 text-[11px] text-red-300">{craft.events[craft.events.length - 1]?.title}</p>
        ) : null}
        {broken ? <p className="mt-2 text-[11px] text-red-300/80">В архиве. Больше не тревожим.</p> : null}
        {!archived ? <p className="mt-2 font-mono text-[10px] text-zinc-600">тап — телеметрия</p> : null}
      </button>
      {!archived && !selected ? (
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => onSelect(craft.id)}>
          Вести этот КА
        </Button>
      ) : null}
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
            Плата сразу. Дальше три проверки на реакцию: от них зависит, сколько аппарат проживёт.
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

"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CAMERAS, HULLS, MEMORIES, ORBITS } from "@/lib/game/data";
import { craftTelemetry, fmtCoord } from "@/lib/game/orbit";
import {
  cameraLabel,
  craftJobs,
  craftLeft,
  craftSlots,
  craftStatusLabel,
  formatBureauClock,
  formatSpan,
} from "@/lib/game/save";
import type { Craft, GameState } from "@/lib/game/types";

export function TelemetrySheet({
  open,
  craft,
  state,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  craft: Craft | null;
  state: GameState;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}) {
  if (!craft) return null;
  const tm = craftTelemetry(craft, state.timeSec);
  const left = craftLeft(craft, state.timeSec);
  const used = craftJobs(state, craft.id).length;
  const slots = craftSlots(craft);
  const dead = craft.status !== "alive";
  const last = craft.events[craft.events.length - 1];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#0e1420]">
        <SheetHeader>
          <SheetTitle>{craft.name}</SheetTitle>
          <SheetDescription>
            {HULLS[craft.hull].name} · {ORBITS[craft.orbit].name} · {craftStatusLabel(craft)}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 px-4 pb-6">
          {last && craft.status === "alive" ? (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-red-300">авария</p>
              <p className="mt-1 text-sm">{last.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{last.detail}</p>
            </div>
          ) : null}

          {dead ? (
            <div className="rounded-2xl border border-white/10 bg-[#121826] p-3 text-sm text-zinc-400">
              {craft.status === "failed"
                ? "Аппарат вышел из строя. Телеметрия замерла на последнем кадре."
                : "Вошёл в атмосферу. Сгорел."}
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <Stat k="Широта / долгота" v={fmtCoord(tm.lat, tm.lon)} />
            <Stat k="Высота" v={`${Math.round(tm.altKm)} км`} />
            <Stat k="Скорость" v={`${tm.speed.toFixed(2)} км/с`} />
            <Stat k="Наклонение" v={`${tm.inc.toFixed(1)}°`} />
            <Stat k="Перигей / апогей" v={`${Math.round(tm.periKm)} / ${Math.round(tm.apoKm)} км`} />
            <Stat k="Эксцентриситет" v={tm.ecc.toFixed(3)} />
            <Stat k="Темп. корпуса" v={`${tm.tempC.toFixed(1)} °C`} />
            <Stat k="Шина" v={`${tm.busV.toFixed(1)} В`} />
            <Stat k="Ориентация" v={tm.attitude} />
            <Stat k="Радио" v={tm.radio} />
            <Stat k="Питание" v={tm.power} />
            <Stat k="Тепло" v={tm.thermal} />
            <Stat k="Камеры" v={cameraLabel(craft.cameras)} />
            <Stat k="БЗУ" v={`${used}/${slots} · ${MEMORIES[craft.memory].name}`} />
            <Stat k="Срок" v={dead ? craftStatusLabel(craft) : `ещё ${formatSpan(left)}`} />
            <Stat k="Каналы" v={craft.cameras.map((id) => CAMERAS[id].name).join(", ")} />
          </dl>

          <section>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">События борта</p>
            {craft.events.length === 0 ? (
              <p className="text-sm text-zinc-500">Отказов нет. Все контуры в допуске.</p>
            ) : (
              <ul className="grid gap-2">
                {craft.events
                  .slice()
                  .reverse()
                  .map((ev) => (
                    <li key={ev.id} className="rounded-2xl border border-white/10 bg-[#121826] p-3">
                      <p className="font-mono text-[10px] text-copper">{formatBureauClock(ev.at)}</p>
                      <p className="mt-0.5 text-sm">{ev.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{ev.detail}</p>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {!dead ? (
            <Button
              className="h-12 w-full"
              onClick={() => {
                onSelect(craft.id);
                onOpenChange(false);
              }}
            >
              Вести этот КА
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#121826]/80 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-zinc-600">{k}</dt>
      <dd className="mt-0.5 font-mono text-[12px] text-zinc-200">{v}</dd>
    </div>
  );
}

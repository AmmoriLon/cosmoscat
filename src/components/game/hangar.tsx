"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SYSTEMS } from "@/lib/game/data";
import { systemReady } from "@/lib/game/save";
import type { GameState, SystemId } from "@/lib/game/types";

const ORDER: SystemId[] = ["rocket", "booster", "sat"];

export function Hangar({
  state,
  onFocus,
  onTap,
  onLaunch,
}: {
  state: GameState;
  onFocus: (id: SystemId) => void;
  onTap: () => void;
  onLaunch: () => void;
}) {
  const ready = systemReady(state.repairs);
  const focused = SYSTEMS[state.focused];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-4 pt-2">
      <p className="px-1 text-sm text-zinc-400">
        Инженеры уже в смене и медленно чинят всё сразу. Твой тап — по выбранному железу.
        Порядок как у людей: носитель, разгонный блок, потом КА.
      </p>
      <div className="grid gap-2">
        {ORDER.map((id) => {
          const spec = SYSTEMS[id];
          const v = state.repairs[id];
          const active = state.focused === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFocus(id)}
              className={`rounded-2xl border p-3 text-left transition ${
                active
                  ? "border-copper/70 bg-copper/10"
                  : "border-white/10 bg-[#121826]/70"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-[15px]">{spec.name}</p>
                  <p className="font-mono text-[10px] tracking-wider text-teal/80">{spec.code}</p>
                </div>
                <p className="font-mono text-sm text-copper">{Math.floor(v)}%</p>
              </div>
              <Progress value={v} className="gap-0" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {spec.chips.map((chip, i) => {
                  const on = v >= (i + 1) * 25;
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
            </button>
          );
        })}
      </div>

      <Card className="border-white/10 bg-[#121826]/60">
        <CardHeader className="pb-1">
          <CardTitle className="font-heading">{focused.name}</CardTitle>
          <CardDescription>{focused.blurb}</CardDescription>
        </CardHeader>
      </Card>

      {ready ? (
        <Button className="h-14 w-full text-base" onClick={onLaunch}>
          Вывезти на старт
        </Button>
      ) : (
        <Button className="tap-btn h-16 w-full text-lg" onClick={onTap}>
          Работать руками · {focused.code}
        </Button>
      )}
    </div>
  );
}

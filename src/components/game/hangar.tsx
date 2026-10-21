"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-4 pt-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d121c] text-left"
      >
        <Image
          src={focused.image}
          alt={focused.name}
          width={720}
          height={480}
          className="h-48 w-full object-cover sm:h-64"
        />
        <p className="px-3 py-2 text-xs text-zinc-400">Нажми — большая картинка {focused.name}</p>
      </button>

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
              className={`flex gap-3 rounded-2xl border p-2 text-left transition ${
                active ? "border-copper/70 bg-copper/10" : "border-white/10 bg-[#121826]/70"
              }`}
            >
              <Image
                src={spec.image}
                alt=""
                width={128}
                height={128}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-[15px]">{spec.name}</p>
                    <p className="font-mono text-[10px] tracking-wider text-teal/80">{spec.code}</p>
                  </div>
                  <p className="font-mono text-sm text-copper">{Math.floor(v)}%</p>
                </div>
                <Progress value={v} className="gap-0" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="px-1 text-sm text-zinc-400">{focused.blurb}</p>
      <div className="flex flex-wrap gap-1.5">
        {focused.chips.map((chip, i) => {
          const on = state.repairs[state.focused] >= (i + 1) * 25;
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

      {ready ? (
        <Button className="h-14 w-full text-base" onClick={onLaunch}>
          Вывезти на старт
        </Button>
      ) : (
        <Button className="tap-btn h-16 w-full text-lg" onClick={onTap}>
          Собирать · {focused.name}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] border-white/10 bg-[#0e1420] sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{focused.name}</DialogTitle>
            <DialogDescription>{focused.blurb}</DialogDescription>
          </DialogHeader>
          <Image
            src={focused.image}
            alt={focused.name}
            width={900}
            height={1200}
            className="h-auto w-full rounded-xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

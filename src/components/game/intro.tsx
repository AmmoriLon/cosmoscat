"use client";

import { Button } from "@/components/ui/button";
import { INTRO } from "@/lib/game/data";
import { CatPortrait } from "./cat-portrait";

export function Intro({
  step,
  onNext,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const line = INTRO[Math.min(step, INTRO.length - 1)];
  return (
    <div className="flex flex-1 flex-col justify-end gap-5 px-4 pb-6 pt-8 sm:justify-center sm:px-8">
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-[#121826]/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="mb-4 flex items-center gap-3">
          <CatPortrait fur={line.fur} hat={line.speaker.includes("президент")} />
          <div>
            <p className="font-heading text-lg leading-tight">{line.speaker}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-copper/80">{line.role}</p>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-200">{line.text}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-zinc-500">
            БРИФИНГ {step + 1}/{INTRO.length}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onSkip}>
              К ангару
            </Button>
            <Button className="h-10 px-4" onClick={onNext}>
              {step >= INTRO.length - 1 ? "Принять КБ" : "Дальше"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

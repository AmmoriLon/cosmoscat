"use client";

import { LAUNCH_BEATS } from "@/lib/game/data";

export function Launch({ t }: { t: number }) {
  const beat = [...LAUNCH_BEATS].reverse().find((b) => t >= b.t) ?? LAUNCH_BEATS[0];
  const lift = Math.min(1, Math.max(0, (t - 2.8) / 7.2));

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(232,162,90,0.18),transparent_50%)]" />
      <div className="relative mx-auto mt-6 w-full max-w-lg px-4">
        <p className="font-mono text-[11px] tracking-[0.2em] text-teal">ТКУ · КАМЫШ-2 · ПН ЛАПКА-1</p>
        <h2 className="font-heading mt-1 text-2xl">{beat.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{beat.detail}</p>
        <p className="mt-3 font-mono text-xs text-copper">T+{t.toFixed(1)} с</p>
      </div>
      <div className="relative mt-auto flex h-[46vh] items-end justify-center pb-6">
        <div
          className="rocket"
          style={{ transform: `translateY(${-lift * 220}px) scale(${1 - lift * 0.25})` }}
        >
          <div className="rocket-body" />
          <div className="rocket-fairing" />
          <div className="rocket-flame" />
        </div>
        <div className="absolute bottom-0 h-10 w-full bg-gradient-to-t from-[#2a2118] to-transparent" />
      </div>
    </div>
  );
}

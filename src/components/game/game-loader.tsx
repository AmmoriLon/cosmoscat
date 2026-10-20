"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("./game").then((m) => m.Game), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-[#070b12] text-sm text-zinc-400">
      Поднимаем архив КБ…
    </div>
  ),
});

export function GameLoader() {
  return <Game />;
}

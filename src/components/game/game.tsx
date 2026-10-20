"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GAME_TITLE } from "@/lib/game/data";
import { formatMoney } from "@/lib/game/save";
import { useGame } from "@/lib/game/use-game";
import { BureauSheet } from "./bureau-sheet";
import { Hangar } from "./hangar";
import { Intro } from "./intro";
import { Launch } from "./launch";
import { OpsPanel } from "./ops";
import { PhotoDialog } from "./photo-dialog";

const Globe = dynamic(() => import("./globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => (
    <div className="flex h-[46vh] min-h-[260px] items-center justify-center bg-[#05070d] text-sm text-zinc-500 lg:h-auto lg:min-h-[520px] lg:flex-1">
      Поднимаем Землю…
    </div>
  ),
});

export function Game() {
  const { ready, state, sim, simRef, actions } = useGame();
  const [bureau, setBureau] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [flash, setFlash] = useState(0);

  const photoContract = useMemo(
    () => state.contracts.find((c) => c.id === state.job?.contractId) ?? null,
    [state.contracts, state.job],
  );

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#070b12] text-sm text-zinc-400">
        Поднимаем архив КБ…
      </div>
    );
  }

  return (
    <div className="game-root">
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-copper">ГЕНКОНСТРУКТОР</p>
          <h1 className="font-heading text-xl leading-none">{GAME_TITLE}</h1>
        </div>
        {state.phase !== "intro" ? (
          <div className="text-right">
            <p className="font-mono text-sm text-copper">{formatMoney(state.money)}</p>
            <p className="text-[10px] text-zinc-500">
              {state.phase === "ops" ? `виток ${state.orbits}` : "ангар / старт"}
            </p>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={actions.skipIntro}>
            Пропуск
          </Button>
        )}
      </header>

      {state.phase === "intro" ? (
        <Intro step={state.introStep} onNext={actions.introNext} onSkip={actions.skipIntro} />
      ) : null}

      {state.phase === "hangar" ? (
        <Hangar
          state={state}
          onFocus={actions.focus}
          onTap={actions.tap}
          onLaunch={actions.startLaunch}
        />
      ) : null}

      {state.phase === "launch" ? <Launch t={state.launchT} /> : null}

      {state.phase === "ops" ? (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Globe
            simRef={simRef}
            contracts={state.contracts}
            flash={flash}
            jobActive={!!state.job}
          />
          <div className="min-h-0 lg:w-[440px] lg:overflow-y-auto lg:border-l lg:border-white/10">
            <OpsPanel
              state={state}
              sim={sim}
              onAccept={actions.accept}
              onShoot={(id) => {
                actions.shoot(id);
                setFlash(performance.now());
                setPhotoOpen(true);
              }}
              onOpenPhoto={() => setPhotoOpen(true)}
              onOpenBureau={() => setBureau(true)}
            />
          </div>
        </div>
      ) : null}

      <PhotoDialog
        open={photoOpen && !!state.job}
        job={state.job}
        contract={photoContract}
        opticsLevel={state.opticsLevel}
        onSell={() => {
          actions.sell();
          setPhotoOpen(false);
        }}
        onClose={() => setPhotoOpen(false)}
      />

      <BureauSheet
        open={bureau}
        onOpenChange={setBureau}
        state={state}
        onOptics={actions.buyOptics}
        onOps={actions.buyOps}
        onReset={() => {
          actions.reset();
          setBureau(false);
          setPhotoOpen(false);
        }}
      />
    </div>
  );
}

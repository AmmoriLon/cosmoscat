"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GAME_TITLE } from "@/lib/game/data";
import { activeCraft, formatBureauClock, formatMoney } from "@/lib/game/save";
import { useGame } from "@/lib/game/use-game";
import { BureauSheet } from "./bureau-sheet";
import { FleetPanel } from "./fleet";
import { Globe } from "./globe";
import { Hangar } from "./hangar";
import { Intro } from "./intro";
import { Launch } from "./launch";
import { OpsPanel } from "./ops";
import { PhotoDialog } from "./photo-dialog";

export function Game() {
  const { state, sim, simRef, actions } = useGame();
  const [bureau, setBureau] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);

  const openJob = useMemo(() => {
    if (photoId) return state.jobs.find((j) => j.id === photoId) ?? null;
    return state.jobs[state.jobs.length - 1] ?? null;
  }, [photoId, state.jobs]);

  const photoContract = useMemo(
    () => state.contracts.find((c) => c.id === openJob?.contractId) ?? null,
    [state.contracts, openJob],
  );

  const craft = activeCraft(state);

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
              {state.phase === "ops"
                ? `${formatBureauClock(state.timeSec)} · виток ${state.orbits}`
                : "ангар / старт"}
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

      {state.phase === "launch" ? <Launch t={state.launchT} craft={state.pendingCraft} /> : null}

      {state.phase === "ops" ? (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {state.tab === "contracts" ? (
            <Globe
              simRef={simRef}
              contracts={state.contracts}
              flash={flash}
              jobActive={state.jobs.some((j) => j.stage === "onboard" || j.stage === "downlink")}
              orbitId={craft?.orbit ?? "sso535"}
            />
          ) : null}
          <div className="min-h-0 flex-1 lg:w-[440px] lg:overflow-y-auto lg:border-l lg:border-white/10">
            {state.tab === "contracts" ? (
              <OpsPanel
                state={state}
                sim={sim}
                onAccept={actions.accept}
                onShoot={(id) => {
                  actions.shoot(id);
                  setFlash(performance.now());
                  setPhotoId(null);
                  setPhotoOpen(true);
                }}
                onOpenPhoto={(id) => {
                  setPhotoId(id ?? null);
                  setPhotoOpen(true);
                }}
                onOpenBureau={() => setBureau(true)}
              />
            ) : (
              <FleetPanel
                state={state}
                onSelect={actions.selectCraft}
                onOpenWorkshop={actions.openWorkshop}
                onCloseWorkshop={actions.closeWorkshop}
                onName={(name) => actions.editWorkshop({ name })}
                onOrbit={actions.setOrbit}
                onMemory={actions.setMemory}
                onToggleCamera={actions.toggleCamera}
                onCommit={actions.commitBuild}
              />
            )}
          </div>
        </div>
      ) : null}

      {state.phase === "ops" ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0b1018]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-1 p-2">
            <Button
              variant={state.tab === "contracts" ? "default" : "ghost"}
              className="h-11"
              onClick={() => actions.setTab("contracts")}
            >
              Заявки
            </Button>
            <Button
              variant={state.tab === "fleet" ? "default" : "ghost"}
              className="h-11"
              onClick={() => actions.setTab("fleet")}
            >
              Аппараты
            </Button>
          </div>
        </nav>
      ) : null}

      <PhotoDialog
        open={photoOpen && !!openJob}
        job={openJob}
        contract={photoContract}
        opticsLevel={state.opticsLevel}
        onSell={(jobId) => {
          actions.sell(jobId);
          setPhotoId(null);
          setPhotoOpen(false);
        }}
        onClose={() => {
          setPhotoId(null);
          setPhotoOpen(false);
        }}
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
          setPhotoId(null);
          setPhotoOpen(false);
        }}
      />
    </div>
  );
}

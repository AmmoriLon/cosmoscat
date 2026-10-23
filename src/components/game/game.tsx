"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME_TITLE } from "@/lib/game/data";
import { play, setSoundMuted, soundMuted, unlockSound } from "@/lib/game/sfx";
import { formatBureauClock, formatMoney } from "@/lib/game/save";
import { useGame } from "@/lib/game/use-game";
import type { Craft } from "@/lib/game/types";
import { AssemblyGames } from "./assembly-games";
import { BureauSheet } from "./bureau-sheet";
import { FleetPanel } from "./fleet";
import { Globe } from "./globe";
import { Hangar } from "./hangar";
import { Intro } from "./intro";
import { Launch } from "./launch";
import { OpsPanel } from "./ops";
import { PhotoDialog } from "./photo-dialog";
import { TelemetrySheet } from "./telemetry-sheet";

export function Game() {
  const { state, sim, simRef, actions } = useGame();
  const [bureau, setBureau] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundMuted());
  }, []);

  const openJob = useMemo(() => {
    if (photoId) return state.jobs.find((j) => j.id === photoId) ?? null;
    return state.jobs[state.jobs.length - 1] ?? null;
  }, [photoId, state.jobs]);

  const photoContract = useMemo(
    () => state.contracts.find((c) => c.id === openJob?.contractId) ?? null,
    [state.contracts, openJob],
  );

  const inspectCraft = state.crafts.find((c) => c.id === inspectId) ?? null;

  return (
    <div className="game-root" onPointerDown={unlockSound}>
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-copper">ГЕНКОНСТРУКТОР</p>
          <h1 className="font-heading text-xl leading-none">{GAME_TITLE}</h1>
        </div>
        {state.phase !== "intro" ? (
          <div className="flex items-center gap-2">
            <SoundToggle
              muted={muted}
              onToggle={() => {
                const next = !muted;
                setSoundMuted(next);
                setMuted(next);
                if (!next) {
                  unlockSound();
                  play("ui");
                }
              }}
            />
            {state.phase === "ops" ? (
              <AlarmMark crafts={state.crafts} onOpen={(id) => setInspectId(id)} />
            ) : null}
            <div className="text-right">
              <p className="font-mono text-sm text-copper">{formatMoney(state.money)}</p>
              <p className="text-[10px] text-zinc-500">
                {state.phase === "ops"
                  ? `${formatBureauClock(state.timeSec)} · виток ${state.orbits}`
                  : "ангар / старт"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <SoundToggle
              muted={muted}
              onToggle={() => {
                const next = !muted;
                setSoundMuted(next);
                setMuted(next);
                if (!next) {
                  unlockSound();
                  play("ui");
                }
              }}
            />
            <Button variant="ghost" size="sm" onClick={actions.skipIntro}>
              Пропуск
            </Button>
          </div>
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

      {state.phase === "ops" ? <FailureToasts crafts={state.crafts} /> : null}

      {state.phase === "ops" && state.assembly ? (
        <AssemblyGames state={state} onScore={actions.finishMinigame} onLaunch={actions.launchBuilt} />
      ) : null}

      {state.phase === "ops" && !state.assembly ? (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {state.tab === "contracts" ? (
            <Globe
              simRef={simRef}
              contracts={state.contracts}
              crafts={state.crafts}
              activeCraftId={state.activeCraftId}
              flash={flash}
              jobActive={state.jobs.some((j) => j.stage === "onboard" || j.stage === "downlink")}
              onInspect={(id) => setInspectId(id)}
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
                onInspect={(id) => setInspectId(id)}
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

      {state.phase === "ops" && !state.assembly ? (
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
              {state.crafts.some((c) => c.status === "alive" && c.events.length > 0) ? (
                <AlertTriangle className="size-4 text-red-300" />
              ) : null}
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

      <TelemetrySheet
        open={!!inspectCraft}
        craft={inspectCraft}
        state={state}
        onOpenChange={(open) => {
          if (!open) setInspectId(null);
        }}
        onSelect={actions.selectCraft}
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
          setInspectId(null);
        }}
      />
    </div>
  );
}

function SoundToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? "Включить звук" : "Выключить звук"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5"
    >
      {muted ? <VolumeX className="size-4 text-zinc-400" /> : <Volume2 className="size-4 text-zinc-200" />}
    </button>
  );
}

function alarmedCrafts(crafts: Craft[]) {
  return crafts.filter((c) => c.status === "alive" && c.events.length > 0);
}

function AlarmMark({ crafts, onOpen }: { crafts: Craft[]; onOpen: (id: string) => void }) {
  const alarmed = alarmedCrafts(crafts);
  if (!alarmed.length) return null;
  const latest = alarmed[alarmed.length - 1];
  return (
    <button
      type="button"
      onClick={() => onOpen(latest.id)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-400/70 bg-red-600/35"
      aria-label="Авария: аппарат выходит из строя"
    >
      <AlertTriangle className="size-5 animate-pulse text-red-100" />
    </button>
  );
}

type AlarmToast = { id: string; craftId: string; name: string; title: string };

function FailureToasts({ crafts }: { crafts: Craft[] }) {
  const [toasts, setToasts] = useState<AlarmToast[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const ready = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ready.current = true;
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const alive = new Set(crafts.filter((craft) => craft.status === "alive").map((craft) => craft.id));
    for (const craft of crafts) {
      if (craft.status === "alive") continue;
      for (const event of craft.events) seen.current.add(event.id);
    }
    const items: AlarmToast[] = [];
    for (const craft of crafts) {
      if (craft.status !== "alive") continue;
      for (const event of craft.events) {
        items.push({
          id: event.id,
          craftId: craft.id,
          name: craft.name,
          title: event.title,
        });
      }
    }
    if (!ready.current) {
      seen.current = new Set([...seen.current, ...items.map((item) => item.id)]);
      setToasts((prev) => prev.filter((toast) => alive.has(toast.craftId)));
      return;
    }
    const fresh = items.filter((item) => !seen.current.has(item.id));
    fresh.forEach((item) => seen.current.add(item.id));
    if (fresh.length) play("alarm");
    setToasts((prev) => [...prev.filter((toast) => alive.has(toast.craftId)), ...fresh].slice(-3));
  }, [crafts]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex flex-col gap-2 px-3">
      {toasts.map((toast) => (
        <AlarmToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function AlarmToastCard({ toast, onDismiss }: { toast: AlarmToast; onDismiss: (id: string) => void }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  useEffect(() => {
    if (dragging) return;
    const timer = window.setTimeout(dismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [dismiss, dragging]);

  return (
    <div
      className="pointer-events-auto flex touch-none items-center gap-3 rounded-2xl border border-red-400/70 bg-red-700/90 px-3 py-2.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      style={{
        transform: `translateX(${dx}px)`,
        opacity: Math.max(0, 1 - Math.abs(dx) / 180),
        transition: dragging ? "none" : "transform 180ms ease, opacity 180ms ease",
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, dx: 0 };
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const next = e.clientX - drag.current.x;
        drag.current.dx = next;
        setDx(next);
      }}
      onPointerUp={() => {
        const moved = drag.current?.dx ?? 0;
        drag.current = null;
        setDragging(false);
        if (Math.abs(moved) > 72) dismiss();
        else setDx(0);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        setDx(0);
      }}
    >
      <AlertTriangle className="size-5 shrink-0 text-red-100" aria-hidden />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-red-50">«{toast.name}» выходит из строя</span>
        <span className="block truncate text-xs text-red-100/85">{toast.title}</span>
      </span>
    </div>
  );
}

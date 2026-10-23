"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, Settings, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAY_SEC, ORBITS } from "@/lib/game/data";
import {
  BUILD_VERDICT,
  buildGrade,
  formatSpan,
  lifeCutForBuild,
} from "@/lib/game/save";
import type { GameState } from "@/lib/game/types";
import { play } from "@/lib/game/sfx";
import { CatPortrait } from "./cat-portrait";

const GEAR_ROUNDS = 4;

export function AssemblyGames({
  state,
  onScore,
  onLaunch,
}: {
  state: GameState;
  onScore: (score: number) => void;
  onLaunch: () => void;
}) {
  const assembly = state.assembly;
  const finish = useStable(onScore);
  if (!assembly) return null;
  const craft = assembly.craft;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-6 pt-2">
      <p className="font-mono text-[11px] tracking-[0.16em] text-teal">
        СБОРКА · {craft.name.toUpperCase()} · {ORBITS[craft.orbit].name}
      </p>
      {assembly.step === "gear" ? <GearGame onDone={finish} /> : null}
      {assembly.step === "bolts" ? <BoltsGame onDone={finish} /> : null}
      {assembly.step === "flash" ? <FlashGame onDone={finish} /> : null}
      {assembly.step === "verdict" ? (
        <Verdict scores={assembly.scores} orbitLife={lifeCutForBuild(craft.orbit, assembly.scores)} onLaunch={onLaunch} />
      ) : null}
    </div>
  );
}

function useStable(fn: (score: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((score: number) => ref.current(score), []);
}

function useEdgeFlash() {
  const [tone, setTone] = useState<"good" | "bad" | null>(null);
  const timer = useRef(0);
  const ping = useCallback((good: boolean) => {
    window.clearTimeout(timer.current);
    setTone(good ? "good" : "bad");
    timer.current = window.setTimeout(() => setTone(null), 480);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { tone, ping };
}

function EdgeGlow({ tone }: { tone: "good" | "bad" | null }) {
  if (!tone) return null;
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-40 ${tone === "good" ? "edge-good" : "edge-bad"}`}
    />
  );
}

function rim(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 50 + r * Math.sin(rad), y: 50 - r * Math.cos(rad) };
}

function rimArc(start: number, width: number, r: number) {
  const a = rim(start, r);
  const b = rim(start + width, r);
  const large = width > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

function inStrip(angle: number, start: number, width: number) {
  return ((angle - start) % 360 + 360) % 360 <= width;
}

function GearGame({ onDone }: { onDone: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [angle, setAngle] = useState(210);
  const [zone, setZone] = useState({ start: 36, width: 88 });
  const [flash, setFlash] = useState<string | null>(null);
  const { tone, ping } = useEdgeFlash();
  const [pop, setPop] = useState(0);
  const scores = useRef<number[]>([]);
  const angleRef = useRef(210);
  const zoneRef = useRef(zone);
  const spun = useRef(0);
  const locked = useRef(false);
  const roundRef = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  zoneRef.current = zone;
  roundRef.current = round;

  const advance = useCallback((score: number, label: string) => {
    if (locked.current) return;
    locked.current = true;
    scores.current.push(score);
    ping(score > 0);
    play(score > 0 ? "good" : "bad");
    setFlash(label);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(score ? 12 : 28);
    window.setTimeout(() => {
      if (scores.current.length >= GEAR_ROUNDS) {
        const avg = scores.current.reduce((sum, n) => sum + n, 0) / GEAR_ROUNDS;
        onDoneRef.current(Math.round(avg));
        return;
      }
      const width = 88 - scores.current.length * 10;
      const start = 24 + Math.random() * 280;
      const next = { start, width };
      zoneRef.current = next;
      setZone(next);
      angleRef.current = (start + width + 90) % 360;
      spun.current = 0;
      locked.current = false;
      setAngle(angleRef.current);
      setRound(scores.current.length);
      setFlash(null);
      setPop((n) => n + 1);
    }, 640);
  }, []);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (!locked.current) {
        const speed = 118 + roundRef.current * 34;
        angleRef.current = (angleRef.current + speed * dt) % 360;
        spun.current += speed * dt;
        setAngle(angleRef.current);
        if (spun.current > 440) advanceRef.current(0, "Мимо");
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const inside = inStrip(angle, zone.start, zone.width);
  const gear = rim(angle, 33);

  return (
    <div className="flex flex-1 flex-col items-center">
      <EdgeGlow tone={tone} />
      <h2 className="font-heading mt-3 text-xl">Шестерня</h2>
      <p className="mt-1 text-center text-sm text-zinc-400">
        Кружок вылетает. Жми, когда шестерёнка в медной полосе.
      </p>
      <p className="mt-2 font-mono text-[11px] text-zinc-500">
        заход {round + 1}/{GEAR_ROUNDS}
        {flash ? ` · ${flash}` : ""}
      </p>
      <button
        key={pop}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          const z = zoneRef.current;
          const a = angleRef.current;
          const delta = ((a - z.start) % 360 + 360) % 360;
          if (delta <= z.width) {
            const mid = Math.abs(delta - z.width / 2);
            advance(mid <= z.width * 0.22 ? 100 : 72, mid <= z.width * 0.22 ? "Точно" : "В полосе");
          } else {
            advance(0, "Мимо");
          }
        }}
        className="assembly-pop relative mt-4 h-64 w-64 touch-none"
        aria-label="Жми, когда шестерёнка в полосе"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="40" fill="#101722" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          <path
            d={rimArc(zone.start, zone.width, 36)}
            fill="none"
            stroke="#e8a25a"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx={rim(zone.start + zone.width / 2, 36).x} cy={rim(zone.start + zone.width / 2, 36).y} r="1.3" fill="#fff6d2" />
        </svg>
        <span
          className="absolute"
          style={{ left: `${gear.x}%`, top: `${gear.y}%`, transform: "translate(-50%, -50%)" }}
        >
          <Settings className={`size-8 ${inside ? "text-copper" : "text-zinc-100"}`} strokeWidth={2.4} />
        </span>
      </button>
      <p className="mt-3 text-center text-xs text-zinc-500">
        {flash === "Точно" ? "В самом центре полосы." : flash === "В полосе" ? "Попал в полосу." : flash === "Мимо" ? "Мимо полосы." : "Полоса — медная дуга."}
      </p>
    </div>
  );
}

function BoltsGame({ onDone }: { onDone: (score: number) => void }) {
  const [cell, setCell] = useState<number | null>(null);
  const [bad, setBad] = useState(false);
  const [note, setNote] = useState("Жди болт");
  const [left, setLeft] = useState(10);
  const tally = useRef({ good: 0, hit: 0, badTap: 0 });
  const spawn = useRef<{ id: number; cell: number; bad: boolean } | null>(null);
  const { tone, ping } = useEdgeFlash();
  const pingRef = useRef(ping);
  pingRef.current = ping;

  useEffect(() => {
    let cancel = false;
    const ids: number[] = [];
    const later = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!cancel) fn();
      }, ms);
      ids.push(id);
    };
    const plan = Array.from({ length: 10 }, (_, i) => i >= 7).sort(() => Math.random() - 0.5);
    let i = 0;
    const next = () => {
      if (i >= plan.length) {
        const t = tally.current;
        const raw = (t.hit / Math.max(1, t.good)) * 100 - t.badTap * 24;
        onDone(Math.round(Math.max(0, Math.min(100, raw))));
        return;
      }
      const isBad = plan[i];
      i += 1;
      if (!isBad) tally.current.good += 1;
      const item = { id: i, cell: Math.floor(Math.random() * 6), bad: isBad };
      spawn.current = item;
      setCell(item.cell);
      setBad(isBad);
      setLeft(plan.length - i);
      setNote(isBad ? "Брак — не жми" : "Болт — жми");
      later(isBad ? 760 : Math.max(520, 980 - i * 45), () => {
        if (spawn.current?.id === item.id) {
          if (!item.bad) {
            pingRef.current(false);
            play("bad");
          }
          spawn.current = null;
          setCell(null);
        }
        later(240, next);
      });
    };
    later(400, next);
    return () => {
      cancel = true;
      ids.forEach(clearTimeout);
    };
  }, [onDone]);

  return (
    <div className="flex flex-1 flex-col">
      <EdgeGlow tone={tone} />
      <h2 className="font-heading mt-3 text-xl">Болты</h2>
      <p className="mt-1 text-sm text-zinc-400">Жми живой болт, пока не погас. Красный брак не трогай.</p>
      <p className="mt-2 font-mono text-[11px] text-zinc-500">
        осталось {left} · {note}
      </p>
      <div className="mx-auto mt-5 grid w-full max-w-xs grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => {
          const on = cell === i;
          return (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                const cur = spawn.current;
                if (!cur || cur.cell !== i) return;
                spawn.current = null;
                setCell(null);
                if (cur.bad) {
                  tally.current.badTap += 1;
                  setNote("Схватил брак");
                  ping(false);
                  play("bad");
                } else {
                  tally.current.hit += 1;
                  setNote("Поймал");
                  ping(true);
                  play("good");
                }
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
              }}
              className={`flex h-24 items-center justify-center rounded-2xl border ${
                on && bad
                  ? "border-red-400/70 bg-red-500/20"
                  : on
                    ? "border-teal/70 bg-teal/15"
                    : "border-white/10 bg-[#121826]"
              }`}
            >
              {on && bad ? <Ban className="size-8 text-red-300" /> : null}
              {on && !bad ? <Wrench className="size-8 text-teal" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlashGame({ onDone }: { onDone: (score: number) => void }) {
  const [shown, setShown] = useState<"wait" | "go" | "nogo">("wait");
  const [doneCount, setDoneCount] = useState(0);
  const phase = useRef<{ kind: "wait" | "go" | "nogo"; tapped: boolean }>({ kind: "wait", tapped: false });
  const scoreApi = useRef<{ hit: () => void; bad: () => void } | null>(null);
  const { tone, ping } = useEdgeFlash();
  const pingRef = useRef(ping);
  pingRef.current = ping;

  useEffect(() => {
    let cancel = false;
    const ids: number[] = [];
    const later = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!cancel) fn();
      }, ms);
      ids.push(id);
    };
    const trials: Array<"go" | "nogo"> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) =>
      i % 5 === 1 || i % 5 === 4 ? "nogo" : "go",
    );
    for (let i = trials.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = trials[i];
      trials[i] = trials[j];
      trials[j] = swap;
    }
    const goTotal = trials.filter((t) => t === "go").length;
    let hits = 0;
    let bad = 0;
    let index = 0;

    const step = () => {
      if (index >= trials.length) {
        const raw = (hits / goTotal) * 100 - bad * 16;
        onDone(Math.round(Math.max(0, Math.min(100, raw))));
        return;
      }
      phase.current = { kind: "wait", tapped: false };
      setShown("wait");
      const kind = trials[index];
      index += 1;
      later(420 + Math.random() * 480, () => {
        phase.current = { kind, tapped: false };
        setShown(kind);
        later(680, () => {
          if (kind === "go" && !phase.current.tapped) {
            pingRef.current(false);
            play("bad");
          }
          setDoneCount(index);
          step();
        });
      });
    };
    later(280, step);

    scoreApi.current = {
      hit() {
        hits += 1;
      },
      bad() {
        bad += 1;
      },
    };
    return () => {
      cancel = true;
      ids.forEach(clearTimeout);
    };
  }, [onDone]);

  return (
    <div className="flex flex-1 flex-col items-center">
      <EdgeGlow tone={tone} />
      <h2 className="font-heading mt-3 text-xl">Искра</h2>
      <p className="mt-1 text-center text-sm text-zinc-400">Жми бирюзовую. Красную не трогай — это короткое.</p>
      <p className="mt-2 font-mono text-[11px] text-zinc-500">{doneCount}/12</p>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          const cur = phase.current;
          if (cur.tapped || cur.kind === "wait") return;
          cur.tapped = true;
          if (cur.kind === "go") {
            scoreApi.current?.hit();
            ping(true);
            play("good");
          } else {
            scoreApi.current?.bad();
            ping(false);
            play("bad");
          }
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(cur.kind === "go" ? 10 : 30);
          setShown(cur.kind);
        }}
        className={`assembly-pop mt-6 flex h-56 w-56 items-center justify-center rounded-full border text-lg font-medium ${
          shown === "go"
            ? "border-teal bg-teal/25 text-teal"
            : shown === "nogo"
              ? "border-red-400 bg-red-500/25 text-red-200"
              : "border-white/10 bg-[#121826] text-zinc-500"
        }`}
      >
        {shown === "go" ? "Жми" : shown === "nogo" ? "Не жми" : "Жди"}
      </button>
    </div>
  );
}

function Verdict({
  scores,
  orbitLife,
  onLaunch,
}: {
  scores: number[];
  orbitLife: number;
  onLaunch: () => void;
}) {
  const grade = buildGrade(scores);
  const longer = orbitLife < 0;
  useEffect(() => {
    play(grade === "bad" ? "bad" : grade === "good" ? "coin" : "ui");
  }, [grade]);
  const names = ["Шестерня", "Болты", "Искра"];
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4 rounded-3xl border border-white/10 bg-[#121826]/85 p-4">
        <div className="flex items-center gap-3">
          <CatPortrait name="Пыжик" size={72} />
          <div>
            <p className="font-heading text-lg leading-tight">Пыжик</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-copper/80">главный инженер</p>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-200">{BUILD_VERDICT[grade]}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {scores.map((score, i) => (
          <div key={names[i]} className="rounded-2xl border border-white/10 bg-[#121826] px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{names[i]}</p>
            <p className="font-mono text-sm text-copper">{Math.round(score)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-zinc-300">
        {longer ? "Срок жизни больше паспорта" : "Срок жизни меньше паспорта"} ·{" "}
        <span className="font-mono text-copper">
          {longer ? "+" : "−"}
          {formatSpan(Math.abs(orbitLife))}
        </span>
      </p>
      <p className="mt-1 text-center text-xs text-zinc-500">
        {Math.round((Math.abs(orbitLife) / DAY_SEC) * 10) / 10} сут к ресурсу аппарата
      </p>
      <Button className="mt-auto h-14 w-full text-base" onClick={onLaunch}>
        Вывезти на старт
      </Button>
    </div>
  );
}

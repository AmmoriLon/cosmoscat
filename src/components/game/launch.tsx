"use client";

import { useEffect, useRef, useState } from "react";
import { ORBITS } from "@/lib/game/data";
import type { Craft } from "@/lib/game/types";

const BEATS = [
  { t: 0.15, title: "Готовность", detail: "Стол чист. Расчёт выведения закрыт. Полезная нагрузка законсервирована." },
  { t: 1.8, title: "Зажигание", detail: "ТНА вышел на режим. Давление в камере в допуске. Держим." },
  { t: 3.2, title: "Отрыв", detail: "«Камыш-2» ушёл со стола. Телеметрия есть. Крен в норме." },
  { t: 5.4, title: "Макс Q", detail: "Скоростной напор. Обтекатель держит. Тяга не режем." },
  { t: 7.2, title: "Отделение ступени", detail: "Первая отработала. Разгонный блок живой, БЦВМ отвечает." },
  { t: 9.0, title: "Сброс обтекателя", detail: "ПН видит небо. Створки ушли чисто." },
  { t: 11.0, title: "Довыведение", detail: "«Ласточка-Б» жжёт до рабочего витка." },
  { t: 12.6, title: "Отделение КА", detail: "Аппарат в автономке. СБ раскрылись, радиолиния на ППИ." },
];

export function Launch({ t, craft }: { t: number; craft: Craft | null }) {
  const [clock, setClock] = useState(t);
  const clockRef = useRef(t);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      clockRef.current += dt;
      setClock(clockRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const beat = [...BEATS].reverse().find((b) => clock >= b.t) ?? BEATS[0];
  const ignite = clock >= 1.6;
  const lift = Math.min(1, Math.max(0, (clock - 3.0) / 10.2));
  const sky = Math.min(1, Math.max(0, (clock - 2.4) / 8));
  const name = craft?.name ?? "Лапка-1";
  const orbit = craft ? ORBITS[craft.orbit].name : "ССО 535 км";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: `linear-gradient(180deg, rgb(${8 + sky * 4} ${12 + sky * 8} ${22 + sky * 18}) 0%, rgb(${28 - sky * 16} ${24 - sky * 10} ${32 - sky * 8}) 42%, rgb(${42 - sky * 20} ${28 - sky * 12} ${18 - sky * 6}) 100%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.15 + sky * 0.45 }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 19) % 55}%` }}
          />
        ))}
      </div>

      <div className="relative z-20 mx-auto mt-3 w-full max-w-lg px-4">
        <p className="font-mono text-[11px] tracking-[0.2em] text-teal">
          ТКУ · КАМЫШ-2 · ПН {name.toUpperCase()}
        </p>
        <h2 className="font-heading mt-1 text-2xl">{beat.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{beat.detail}</p>
        <p className="mt-2 text-xs text-zinc-500">Цель: {orbit}</p>
        <p className="mt-1 font-mono text-xs text-copper">T+{clock.toFixed(1)} с</p>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
        <div
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#1a140e] to-transparent"
          style={{ opacity: 1 - lift * 0.92 }}
        />
        <div
          className="absolute bottom-[6%] left-1/2 w-[42vw] max-w-[190px] min-w-[132px]"
          style={{
            transform: `translate(-50%, calc(${-lift * 118}vh)) scale(${1 - lift * 0.38})`,
            willChange: "transform",
          }}
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/game/launch-rocket.png"
              alt="Камыш-2"
              width={557}
              height={1251}
              className="relative z-10 h-auto w-full"
              draggable={false}
            />
            {ignite
              ? [
                  { left: "50%", top: "91.2%", w: 22 + lift * 8, h: 46 + lift * 26 },
                  { left: "29%", top: "92.4%", w: 12 + lift * 5, h: 30 + lift * 16 },
                  { left: "71%", top: "92.4%", w: 12 + lift * 5, h: 30 + lift * 16 },
                  { left: "39%", top: "92.6%", w: 10 + lift * 4, h: 26 + lift * 14 },
                  { left: "61%", top: "92.6%", w: 10 + lift * 4, h: 26 + lift * 14 },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="rocket-flame"
                    style={{
                      top: f.top,
                      left: f.left,
                      width: f.w,
                      height: f.h,
                    }}
                  />
                ))
              : null}
          </div>
        </div>
        {ignite ? (
          <div
            className="absolute bottom-[5%] left-1/2 h-14 w-36 -translate-x-1/2 rounded-full bg-orange-300/20 blur-2xl"
            style={{ opacity: Math.max(0, 0.85 - lift * 0.95) }}
          />
        ) : null}
      </div>
    </div>
  );
}

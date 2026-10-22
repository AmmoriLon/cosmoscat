"use client";

import Image from "next/image";
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
  const beat = [...BEATS].reverse().find((b) => t >= b.t) ?? BEATS[0];
  const ignite = t >= 1.6;
  const lift = Math.min(1, Math.max(0, (t - 3.0) / 9.4));
  const sky = Math.min(1, Math.max(0, (t - 2.4) / 8));
  const name = craft?.name ?? "Лапка-1";
  const orbit = craft ? ORBITS[craft.orbit].name : "ССО 535 км";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: `linear-gradient(180deg, rgb(${8 + sky * 4} ${12 + sky * 8} ${22 + sky * 18}) 0%, rgb(${28 - sky * 16} ${24 - sky * 10} ${32 - sky * 8}) 42%, rgb(${42 - sky * 20} ${28 - sky * 12} ${18 - sky * 6}) 100%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ opacity: 0.15 + sky * 0.45 }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 19) % 55}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto mt-3 w-full max-w-lg px-4">
        <p className="font-mono text-[11px] tracking-[0.2em] text-teal">
          ТКУ · КАМЫШ-2 · ПН {name.toUpperCase()}
        </p>
        <h2 className="font-heading mt-1 text-2xl">{beat.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{beat.detail}</p>
        <p className="mt-2 text-xs text-zinc-500">Цель: {orbit}</p>
        <p className="mt-1 font-mono text-xs text-copper">T+{t.toFixed(1)} с</p>
      </div>

      <div className="relative mt-auto h-[56vh] overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a140e] to-transparent"
          style={{ opacity: 1 - lift * 0.85 }}
        />
        <div className="absolute bottom-8 left-1/2 h-40 w-3 -translate-x-[72px] bg-[#2a3344]" style={{ opacity: 1 - lift }}>
          <div className="absolute -right-6 top-6 h-1 w-8 bg-[#3d4a5e]" />
          <div className="absolute -right-10 top-16 h-1 w-12 bg-[#3d4a5e]" />
        </div>
        <div
          className="absolute bottom-4 left-1/2 w-32 -translate-x-1/2 sm:w-36"
          style={{
            transform: `translate(-50%, ${-lift * 360}px) scale(${1 - lift * 0.32})`,
          }}
        >
          <div className="relative">
            <Image
              src="/game/launch-rocket.png"
              alt="Камыш-2"
              width={433}
              height={984}
              className="relative z-10 h-auto w-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
              priority
            />
            {ignite
              ? [
                  { left: "50%", top: "88.4%", w: 26 + lift * 10, h: 52 + lift * 30 },
                  { left: "34%", top: "89.0%", w: 14 + lift * 6, h: 34 + lift * 18 },
                  { left: "66%", top: "89.0%", w: 14 + lift * 6, h: 34 + lift * 18 },
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
            className="pointer-events-none absolute bottom-4 left-1/2 h-16 w-40 -translate-x-1/2 rounded-full bg-orange-300/25 blur-2xl"
            style={{ opacity: 0.9 - lift * 0.7 }}
          />
        ) : null}
      </div>
    </div>
  );
}

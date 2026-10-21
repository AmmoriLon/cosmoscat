"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROADMAP, UPGRADES } from "@/lib/game/data";
import { formatBureauClock, formatMoney } from "@/lib/game/save";
import type { GameState } from "@/lib/game/types";

export function BureauSheet({
  open,
  onOpenChange,
  state,
  onOptics,
  onOps,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: GameState;
  onOptics: () => void;
  onOps: () => void;
  onReset: () => void;
}) {
  const optics = UPGRADES.optics[state.opticsLevel];
  const ops = UPGRADES.operators[state.operatorsLevel];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#0e1420]">
        <SheetHeader>
          <SheetTitle>Журнал КБ</SheetTitle>
          <SheetDescription>
            {formatBureauClock(state.timeSec)} · бюджет {formatMoney(state.money)} · кадров {state.photosSold} · витков {state.orbits}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          <section>
            <h3 className="font-heading mb-2 text-sm">Модернизация</h3>
            <div className="grid gap-2">
              <UpgradeRow
                title={optics ? optics.title : "Оптика выжата"}
                detail={optics ? optics.detail : "Дальше только новый аппарат."}
                cost={optics?.cost}
                can={!!optics && state.money >= optics.cost}
                onBuy={onOptics}
              />
              <UpgradeRow
                title={ops ? ops.title : "Контур L1 закрыт"}
                detail={ops ? ops.detail : "Операторы больше не очередь."}
                cost={ops?.cost}
                can={!!ops && state.money >= ops.cost}
                onBuy={onOps}
              />
            </div>
          </section>
          <section>
            <h3 className="font-heading mb-2 text-sm">Перспектива отрасли</h3>
            <div className="grid gap-2">
              {ROADMAP.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {item.status === "active" ? "в работе" : item.status === "soon" ? "проект" : "папка"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-400">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="font-heading mb-2 text-sm">Бортовой журнал</h3>
            <ul className="space-y-2">
              {state.log.map((e) => (
                <li key={e.id} className="text-xs leading-relaxed text-zinc-400">
                  {e.text}
                </li>
              ))}
            </ul>
          </section>
          <Button variant="outline" className="w-full" onClick={onReset}>
            Новая смена (сброс)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UpgradeRow({
  title,
  detail,
  cost,
  can,
  onBuy,
}: {
  title: string;
  detail: string;
  cost?: number;
  can: boolean;
  onBuy: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 p-3">
      <div>
        <p className="text-sm">{title}</p>
        <p className="text-xs text-zinc-400">{detail}</p>
      </div>
      {cost ? (
        <Button size="sm" disabled={!can} onClick={onBuy}>
          {formatMoney(cost)}
        </Button>
      ) : null}
    </div>
  );
}

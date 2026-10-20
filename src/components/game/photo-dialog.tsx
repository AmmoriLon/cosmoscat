"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PPIS } from "@/lib/game/data";
import { renderPhoto } from "@/lib/game/photo";
import { formatMoney, photoPayout } from "@/lib/game/save";
import type { Contract, PhotoJob } from "@/lib/game/types";

export function PhotoDialog({
  open,
  job,
  contract,
  opticsLevel,
  onSell,
  onClose,
}: {
  open: boolean;
  job: PhotoJob | null;
  contract: Contract | null;
  opticsLevel: number;
  onSell: () => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raw = !job || job.stage !== "ready";
  const ppi = PPIS.find((p) => p.id === job?.ppiId);

  useEffect(() => {
    if (!open || !contract || !canvasRef.current) return;
    renderPhoto(canvasRef.current, contract, opticsLevel, raw, ppi?.name);
  }, [open, contract, opticsLevel, raw, ppi?.name, job?.stage]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-1.25rem)] border-white/10 bg-[#0e1420] sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{raw ? "Сырой поток" : "Товарный снимок"}</DialogTitle>
          <DialogDescription>
            {contract
              ? raw
                ? "Борт пишет некалиброванный кадр. Продавать такое стыдно — сначала ППИ и операторы."
                : `${contract.client} получит L1, КБ получит деньги.`
              : "Нет кадра"}
          </DialogDescription>
        </DialogHeader>
        <canvas
          ref={canvasRef}
          className="h-auto w-full rounded-xl ring-1 ring-white/10"
        />
        <DialogFooter className="sm:justify-between">
          {job?.stage === "ready" && contract ? (
            <Button className="h-11 w-full sm:w-auto" onClick={onSell}>
              Продать за {formatMoney(photoPayout(contract, opticsLevel))}
            </Button>
          ) : (
            <p className="text-xs text-zinc-400">
              {job?.stage === "downlink"
                ? `Сброс на ${ppi?.name ?? "ППИ"}…`
                : job?.stage === "processing"
                  ? "Операторы делают радиометрию и привязку…"
                  : "Кадр на борту. Ждём зону радиовидимости."}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

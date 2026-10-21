"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PHOTO_IMG, PPIS } from "@/lib/game/data";
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
  const raw = !job || job.stage !== "ready";
  const ppi = PPIS.find((p) => p.id === job?.ppiId);
  const src = contract ? PHOTO_IMG[contract.biome] : "";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-1.25rem)] border-white/10 bg-[#0e1420] sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{raw ? "Кадр с борта" : "Готовый снимок"}</DialogTitle>
          <DialogDescription>
            {contract
              ? raw
                ? "Камера сняла. Сейчас сбросим на ППИ, операторы соберут чистую картинку."
                : `${contract.client} получит снимок, КБ — деньги.`
              : "Нет кадра"}
          </DialogDescription>
        </DialogHeader>
        {src ? (
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
            <Image
              src={src}
              alt={contract?.title ?? "снимок"}
              width={1200}
              height={900}
              className={`h-auto w-full object-cover ${raw ? "contrast-75 saturate-50" : ""}`}
            />
            <p className="bg-black/50 px-3 py-2 font-mono text-[11px] text-zinc-300">
              {contract?.title} · {raw ? "сырой кадр" : "товарный снимок"}
            </p>
          </div>
        ) : null}
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
                  ? "Операторы собирают снимок…"
                  : "Кадр на борту. Ждём ППИ."}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

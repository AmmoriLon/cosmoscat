"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CAMERAS, PPIS } from "@/lib/game/data";
import { etaToTarget, fmtCoord, orbitCanSee } from "@/lib/game/orbit";
import { activeCraft, formatMoney } from "@/lib/game/save";
import type { Contract, GameState, PhotoJob, SimSnapshot } from "@/lib/game/types";
import { CatPortrait } from "./cat-portrait";

export function OpsPanel({
  state,
  sim,
  onAccept,
  onShoot,
  onOpenPhoto,
  onOpenBureau,
}: {
  state: GameState;
  sim: SimSnapshot;
  onAccept: (id: string) => void;
  onShoot: (id: string) => void;
  onOpenPhoto: (jobId?: string) => void;
  onOpenBureau: () => void;
}) {
  const craft = activeCraft(state);
  const shootable = state.contracts.find(
    (c) => c.status === "active" && sim.inImaging.includes(c.id),
  );
  const approaching = state.contracts.find(
    (c) => c.status === "active" && sim.approaching.includes(c.id),
  );
  const ppi = PPIS.filter((p) => sim.inPpi.includes(p.id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-24 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] text-teal">
            {craft ? `КА ${craft.name.toUpperCase()}` : "НЕТ КА"} · {fmtCoord(sim.satLat, sim.satLon)}
          </p>
          <p className="text-xs text-zinc-500">
            {ppi.length
              ? `Зона ППИ: ${ppi.map((p) => p.short).join(", ")}`
              : "Вне зон радиовидимости"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenBureau}>
          КБ · {formatMoney(state.money)}
        </Button>
      </div>

      {state.jobs.map((job) => (
        <JobStrip
          key={job.id}
          job={job}
          contracts={state.contracts}
          onOpenPhoto={() => onOpenPhoto(job.id)}
        />
      ))}

      {!craft || craft.status !== "alive" ? (
        <div className="rounded-2xl border border-copper/40 bg-copper/10 px-4 py-3 text-sm">
          Живого аппарата нет. Открой «Аппараты» и собери новый КА.
        </div>
      ) : shootable ? (
        <Button className="tap-btn h-14 w-full text-base" onClick={() => onShoot(shootable.id)}>
          Снять «{shootable.title}»
        </Button>
      ) : approaching ? (
        <div className="rounded-2xl border border-copper/40 bg-copper/10 px-4 py-3 text-sm">
          Вход в кадр. «{approaching.title}» скоро под полосой — готовь затвор.
        </div>
      ) : null}

      <div className="grid gap-2">
        {state.contracts.map((c) => (
          <ContractCard
            key={c.id}
            contract={c}
            eta={
              c.status === "active" && craft
                ? etaToTarget(sim.anomaly, sim.earthAngle, c.lat, c.lon, craft.orbit)
                : null
            }
            canAccept={
              !!craft &&
              craft.status === "alive" &&
              craft.cameras.includes(c.camera) &&
              orbitCanSee(craft.orbit, c.lat)
            }
            blockReason={
              !craft || craft.status !== "alive"
                ? "нет КА"
                : !craft.cameras.includes(c.camera)
                  ? `нужен ${CAMERAS[c.camera].short}`
                  : !orbitCanSee(craft.orbit, c.lat)
                    ? "вне полосы орбиты"
                    : null
            }
            onAccept={() => onAccept(c.id)}
          />
        ))}
      </div>

      {state.contracts.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">Заявок нет. Радиомолчит.</p>
      ) : null}
    </div>
  );
}

function JobStrip({
  job,
  contracts,
  onOpenPhoto,
}: {
  job: PhotoJob;
  contracts: Contract[];
  onOpenPhoto: () => void;
}) {
  const c = contracts.find((x) => x.id === job.contractId);
  const label =
    job.stage === "onboard"
      ? "На борту"
      : job.stage === "downlink"
        ? "Сброс на ППИ"
        : job.stage === "processing"
          ? "Дешифровка"
          : "Готов к продаже";
  return (
    <button
      type="button"
      onClick={onOpenPhoto}
      className="rounded-2xl border border-white/10 bg-[#121826] p-3 text-left"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm">{c?.title ?? "Кадр"}</p>
        <Badge variant="secondary">{label}</Badge>
      </div>
      {job.stage !== "ready" && job.stage !== "onboard" ? (
        <Progress value={job.progress * 100} className="gap-0" />
      ) : (
        <p className="text-xs text-zinc-400">
          {job.stage === "ready" ? "Открыть товарный снимок" : "Ждём ППИ, чтобы сбросить поток"}
        </p>
      )}
    </button>
  );
}

function ContractCard({
  contract,
  eta,
  canAccept,
  blockReason,
  onAccept,
}: {
  contract: Contract;
  eta: number | null;
  canAccept: boolean;
  blockReason: string | null;
  onAccept: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#121826]/70 p-3">
      <CatPortrait name={contract.client} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium leading-tight">{contract.title}</p>
            <p className="text-[11px] text-zinc-500">
              {contract.client} · {contract.role} · {CAMERAS[contract.camera].short}
            </p>
          </div>
          <p className="font-mono text-[11px] text-copper">{formatMoney(contract.payout)}</p>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{contract.brief}</p>
        <p className="mt-1 font-mono text-[10px] text-zinc-500">{fmtCoord(contract.lat, contract.lon)}</p>
        {contract.status === "offered" ? (
          <Button size="sm" className="mt-2" disabled={!canAccept} onClick={onAccept}>
            {canAccept ? "Принять заявку" : blockReason ?? "нельзя"}
          </Button>
        ) : (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-teal">
            {contract.status === "active"
              ? eta != null && eta < 1
                ? "в кадре — снимай"
                : eta != null
                  ? `в плане · проход через ${Math.max(1, Math.round(eta))} с`
                  : "в плане съёмки"
              : "в контуре"}
          </p>
        )}
      </div>
    </div>
  );
}

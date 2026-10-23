"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CAMERAS, PPIS } from "@/lib/game/data";
import { etaToTarget, fmtCoord, orbitCanSee, trackReaches } from "@/lib/game/orbit";
import { activeCraft, formatMoney } from "@/lib/game/save";
import type { Contract, GameState, PhotoJob, SimSnapshot } from "@/lib/game/types";
import { CatPortrait } from "./cat-portrait";
import { DataFlow } from "./data-flow";

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
  const offered = state.contracts.filter((c) => c.status === "offered");
  const openAll = offered.filter((c) => offerFit(craft, c).ok);
  const later = offered.filter((c) => !offerFit(craft, c).ok);
  const taken = state.contracts.filter((c) => c.status === "active" || c.status === "pipeline");
  const open = openAll.slice(0, 2);
  const queued = openAll.length - open.length;

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
          live={!!job.ppiId && sim.inPpi.includes(job.ppiId)}
          onOpenPhoto={() => onOpenPhoto(job.id)}
        />
      ))}

      {!craft || craft.status !== "alive" ? (
        <div className="rounded-2xl border border-copper/40 bg-copper/10 px-4 py-3 text-sm">
          Живого аппарата нет. Открой «Аппараты» и собери новый КА.
        </div>
      ) : shootable ? (
        <>
          <DataFlow from="Район" to="Борт" tone="capture" />
          <Button className="tap-btn h-14 w-full text-base" onClick={() => onShoot(shootable.id)}>
            Снять «{shootable.title}»
          </Button>
        </>
      ) : approaching ? (
        <div className="rounded-2xl border border-copper/40 bg-copper/10 px-4 py-3 text-sm">
          Вход в кадр. «{approaching.title}» скоро под полосой — готовь затвор.
        </div>
      ) : null}

      <section className="grid gap-2">
        <div>
          <p className="font-heading text-base">Можно принять</p>
          <p className="text-xs text-zinc-500">Только то, что этот аппарат берёт прямо сейчас. На столе не больше двух.</p>
        </div>
        {open.map((c) => (
          <ContractCard
            key={c.id}
            contract={c}
            eta={null}
            canAccept
            blockReason={null}
            onAccept={() => onAccept(c.id)}
          />
        ))}
        {open.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#121826]/70 p-4 text-sm text-zinc-400">
            Свободных заявок под этот аппарат нет.
          </p>
        ) : null}
        {queued > 0 ? (
          <p className="text-xs text-zinc-500">Ещё {queuedLabel(queued)} подождёт, пока освободится стол.</p>
        ) : null}
      </section>

      {taken.length ? (
        <section className="grid gap-2">
          <div>
            <p className="font-heading text-base">Принятые</p>
            <p className="text-xs text-zinc-500">Координаты уже у расчёта. Эти заявки больше не предлагаются.</p>
          </div>
          {taken.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              eta={
                c.status === "active" && craft
                  ? etaToTarget(sim.anomaly, sim.earthAngle, c.lat, c.lon, craft.orbit)
                  : null
              }
              canAccept={false}
              blockReason={null}
              onAccept={() => onAccept(c.id)}
            />
          ))}
        </section>
      ) : null}

      {later.length ? (
        <section className="grid gap-2">
          <div>
            <p className="font-heading text-base">Пока не берём</p>
            <p className="text-xs text-zinc-500">Другая камера или широта вне полосы этого КА.</p>
          </div>
          {later.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              eta={null}
              canAccept={false}
              blockReason={offerFit(craft, c).reason}
              onAccept={() => onAccept(c.id)}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function JobStrip({
  job,
  contracts,
  live,
  onOpenPhoto,
}: {
  job: PhotoJob;
  contracts: Contract[];
  live: boolean;
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
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenPhoto}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPhoto();
        }
      }}
      className="cursor-pointer rounded-2xl border border-white/10 bg-[#121826] p-3 text-left"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm">{c?.title ?? "Кадр"}</p>
        <Badge variant="secondary">{label}</Badge>
      </div>
      {job.stage === "downlink" && live ? <DataFlow from="Борт" to="ППИ" tone="dump" /> : null}
      {job.stage !== "ready" && job.stage !== "onboard" ? (
        <Progress value={job.progress * 100} className="mt-2 gap-0" />
      ) : (
        <p className="mt-2 text-xs text-zinc-400">
          {job.stage === "ready" ? "Открыть товарный снимок" : "Поток на борту. Ждём ППИ, чтобы сбросить."}
        </p>
      )}
    </div>
  );
}

function offerFit(craft: ReturnType<typeof activeCraft>, contract: Contract) {
  if (!craft || craft.status !== "alive") return { ok: false, reason: "нет живого КА" };
  if (!craft.cameras.includes(contract.camera)) return { ok: false, reason: `нужен ${CAMERAS[contract.camera].short}` };
  if (!orbitCanSee(craft.orbit, contract.lat)) return { ok: false, reason: "вне полосы орбиты" };
  if (!trackReaches(craft.orbit, contract.lat, contract.lon)) return { ok: false, reason: "трасса не задевает" };
  return { ok: true, reason: null };
}

function queuedLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "заявка" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "заявки" : "заявок";
  return `${n} ${word}`;
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
  const taken = contract.status === "active" || contract.status === "pipeline";
  const plan =
    contract.status === "pipeline"
      ? "Кадр уже в контуре"
      : eta != null && eta < 1
        ? "В кадре — снимай"
        : eta != null
          ? `Проход через ${Math.max(1, Math.round(eta))} с`
          : "Ждёт полосу съёмки";

  if (!taken && !canAccept) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#121826]/40 px-3 py-2">
        <CatPortrait name={contract.client} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-zinc-300">{contract.title}</p>
          <p className="text-[11px] text-zinc-500">
            {contract.client} · {blockReason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 rounded-2xl border p-3 ${
        taken ? "border-teal/50 bg-teal/10" : "border-copper/40 bg-[#121826]/70"
      }`}
    >
      <CatPortrait name={contract.client} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium leading-tight">{contract.title}</p>
            <p className="text-[11px] text-zinc-500">
              {contract.client} · {contract.role} · {CAMERAS[contract.camera].short}
            </p>
          </div>
          {taken ? (
            <Badge className="bg-teal/20 text-teal">
              <Check aria-hidden />
              Принята
            </Badge>
          ) : (
            <p className="font-mono text-[11px] text-copper">{formatMoney(contract.payout)}</p>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{contract.brief}</p>
        <p className="mt-1 font-mono text-[10px] text-zinc-500">{fmtCoord(contract.lat, contract.lon)}</p>
        {taken ? (
          <p className="mt-2 text-xs text-teal">{plan}</p>
        ) : (
          <Button size="sm" className="mt-2" onClick={onAccept}>
            Принять заявку
          </Button>
        )}
      </div>
    </div>
  );
}

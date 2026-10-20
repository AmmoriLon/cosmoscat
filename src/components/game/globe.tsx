"use client";

import { useEffect, useRef } from "react";
import { EARTH_R, PPIS } from "@/lib/game/data";
import { makeEarthCanvases } from "@/lib/game/earth";
import { latLonToXyz, orbitPoints, rotateY, satEci } from "@/lib/game/orbit";
import type { Contract, SimRef } from "@/lib/game/types";

function project(x: number, y: number, z: number, cx: number, cy: number, scale: number) {
  return { x: cx + x * scale, y: cy - y * scale, front: z >= -0.05, z };
}

function drawGlobe(
  canvas: HTMLCanvasElement,
  tex: HTMLCanvasElement,
  src: Uint8ClampedArray,
  off: HTMLCanvasElement,
  sim: SimRef["current"],
  contracts: Contract[],
  flash: number,
  jobActive: boolean,
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 8 || h < 8) return;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#070b14";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = i % 4 === 0 ? "#e8a25a" : "#d7e6f2";
    ctx.globalAlpha = 0.35 + (i % 5) * 0.08;
    ctx.fillRect((i * 47 + sim.earthAngle * 8) % w, (i * 29) % h, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;

  const cx = w / 2;
  const cy = h / 2 + 4;
  const R = Math.min(w, h) * 0.36;
  const scale = R / EARTH_R;

  const glow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.18);
  glow.addColorStop(0, "rgba(126,200,197,0.0)");
  glow.addColorStop(0.75, "rgba(126,200,197,0.08)");
  glow.addColorStop(1, "rgba(126,200,197,0.0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
  ctx.fill();

  const size = Math.max(140, Math.floor(R * 2));
  if (off.width !== size) {
    off.width = off.height = size;
  }
  const octx = off.getContext("2d");
  if (octx) {
    const img = octx.createImageData(size, size);
    const c = Math.cos(sim.earthAngle);
    const s = Math.sin(sim.earthAngle);
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const nx = (px / (size - 1)) * 2 - 1;
        const ny = 1 - (py / (size - 1)) * 2;
        const rr = nx * nx + ny * ny;
        const i = (py * size + px) * 4;
        if (rr > 1) {
          img.data[i + 3] = 0;
          continue;
        }
        const nz = Math.sqrt(1 - rr);
        const wx = nx * c + nz * s;
        const wz = -nx * s + nz * c;
        const lat = (Math.asin(ny) * 180) / Math.PI;
        let lon = (Math.atan2(wz, wx) * 180) / Math.PI;
        while (lon < -180) lon += 360;
        while (lon > 180) lon -= 360;
        const u = Math.floor(((lon + 180) / 360) * (tex.width - 1));
        const v = Math.floor(((90 - lat) / 180) * (tex.height - 1));
        const si = (v * tex.width + u) * 4;
        const shade = 0.55 + nz * 0.55;
        img.data[i] = src[si] * shade;
        img.data[i + 1] = src[si + 1] * shade;
        img.data[i + 2] = src[si + 2] * shade;
        img.data[i + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.drawImage(off, cx - R, cy - R, R * 2, R * 2);
  }

  ctx.strokeStyle = "rgba(232,162,90,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (const p of orbitPoints(120)) {
    const q = project(p.x, p.y, p.z, cx, cy, scale);
    if (q.front) {
      if (!started) {
        ctx.moveTo(q.x, q.y);
        started = true;
      } else ctx.lineTo(q.x, q.y);
    } else {
      started = false;
    }
  }
  ctx.stroke();

  const drawMark = (lat: number, lon: number, color: string, r = 4) => {
    const local = latLonToXyz(lat, lon, EARTH_R);
    const p = rotateY(local, sim.earthAngle);
    const q = project(p.x, p.y, p.z, cx, cy, scale);
    if (!q.front) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  for (const p of PPIS) drawMark(p.lat, p.lon, "#7ec8c5", 3.5);
  for (const c of contracts.filter((x) => x.status === "active" || x.status === "pipeline")) {
    drawMark(c.lat, c.lon, c.status === "pipeline" ? "#f0d48a" : "#e07a5f", 5);
  }

  const sat = satEci(sim.anomaly);
  const sq = project(sat.x, sat.y, sat.z, cx, cy, scale);
  ctx.fillStyle = flash > 0 && performance.now() - flash < 500 ? "#fff6d2" : "#e8edf2";
  ctx.strokeStyle = "#e8a25a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(sq.x - 5, sq.y - 3, 10, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3a7ad9";
  ctx.fillRect(sq.x - 12, sq.y - 1, 7, 2);
  ctx.fillRect(sq.x + 5, sq.y - 1, 7, 2);

  if (jobActive) {
    ctx.strokeStyle = "rgba(126,200,197,0.45)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sq.x, sq.y);
    ctx.stroke();
  }
}

export function Globe({
  simRef,
  contracts,
  flash,
  jobActive,
}: {
  simRef: SimRef;
  contracts: Contract[];
  flash: number;
  jobActive: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const texRef = useRef<HTMLCanvasElement | null>(null);
  const srcRef = useRef<Uint8ClampedArray | null>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const maps = makeEarthCanvases();
    texRef.current = maps.day;
    const tctx = maps.day.getContext("2d");
    srcRef.current = tctx ? tctx.getImageData(0, 0, maps.day.width, maps.day.height).data : null;
    offRef.current = document.createElement("canvas");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      if (acc >= 0.07 && texRef.current && srcRef.current && offRef.current) {
        acc = 0;
        drawGlobe(
          canvas,
          texRef.current,
          srcRef.current,
          offRef.current,
          simRef.current,
          contracts,
          flash,
          jobActive,
        );
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [contracts, flash, jobActive, simRef]);

  return (
    <div className="relative h-[46vh] min-h-[260px] w-full overflow-hidden bg-[#070b14] sm:h-[52vh] lg:h-auto lg:min-h-[520px] lg:flex-1">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 font-mono text-[10px] text-zinc-300">
        <span className="rounded-full bg-black/45 px-2 py-1">орбита</span>
        <span className="rounded-full bg-black/45 px-2 py-1 text-teal">ППИ</span>
        <span className="rounded-full bg-black/45 px-2 py-1 text-copper">цель</span>
      </div>
    </div>
  );
}

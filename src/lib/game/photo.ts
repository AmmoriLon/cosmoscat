import { GSD_BY_OPTICS } from "./data";
import { fmtCoord } from "./orbit";
import type { Biome, Contract } from "./types";

function fillSky(ctx: CanvasRenderingContext2D, w: number, h: number, biome: Biome) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (biome === "storm") {
    g.addColorStop(0, "#3d4a58");
    g.addColorStop(1, "#1b2430");
  } else if (biome === "ice") {
    g.addColorStop(0, "#9bb4c4");
    g.addColorStop(1, "#d7e4ea");
  } else if (biome === "city") {
    g.addColorStop(0, "#1a2233");
    g.addColorStop(1, "#3a2a22");
  } else if (biome === "desert") {
    g.addColorStop(0, "#7ea0c4");
    g.addColorStop(1, "#d9b56a");
  } else {
    g.addColorStop(0, "#6ea0c8");
    g.addColorStop(1, "#2f6b4a");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawBiome(ctx: CanvasRenderingContext2D, w: number, h: number, biome: Biome, seed: number) {
  const rnd = (i: number) => {
    const n = Math.sin(seed * 0.001 + i * 19.13) * 43758.5453;
    return n - Math.floor(n);
  };

  if (biome === "port") {
    ctx.fillStyle = "#1d4f6a";
    ctx.fillRect(0, h * 0.42, w, h);
    ctx.fillStyle = "#6d7a68";
    ctx.fillRect(0, h * 0.28, w * 0.62, h * 0.5);
    ctx.fillStyle = "#c4b08a";
    for (let i = 0; i < 7; i++) ctx.fillRect(18 + i * 28, h * 0.5, 16, 70);
    ctx.fillStyle = "#d8c39a";
    ctx.fillRect(w * 0.12, h * 0.46, w * 0.4, 10);
  } else if (biome === "fields") {
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? "#6c9a45" : "#c8b45a";
      ctx.fillRect(0, 40 + i * 18, w, 18);
    }
    ctx.strokeStyle = "#3f4a32";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 90 + rnd(i) * 40, 0);
      ctx.lineTo(i * 90 + 30, h);
      ctx.stroke();
    }
  } else if (biome === "storm") {
    ctx.fillStyle = "#243140";
    ctx.fillRect(0, h * 0.55, w, h);
    ctx.fillStyle = "rgba(230,230,230,0.18)";
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.ellipse(w * rnd(i), h * rnd(i + 3) * 0.6, 80 + rnd(i + 1) * 90, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(w * 0.52, h * 0.38, 46, 0, Math.PI * 2);
    ctx.stroke();
  } else if (biome === "ice") {
    ctx.fillStyle = "#d9e6ee";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8aa8b8";
    ctx.fillRect(0, h * 0.62, w, h);
    ctx.strokeStyle = "#6f8b99";
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(rnd(i) * w, rnd(i + 2) * h);
      ctx.lineTo(rnd(i + 5) * w, rnd(i + 8) * h);
      ctx.stroke();
    }
  } else if (biome === "city") {
    ctx.fillStyle = "#121820";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = rnd(i) > 0.4 ? "#e8a25a" : "#7ec8c5";
      ctx.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 3 + rnd(i + 3) * 6, 2);
    }
    ctx.strokeStyle = "rgba(232,162,90,0.35)";
    ctx.beginPath();
    ctx.arc(w * 0.55, h * 0.48, 90, 0, Math.PI * 2);
    ctx.stroke();
  } else if (biome === "coast") {
    ctx.fillStyle = "#1f5c72";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e8eef2";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.3);
    ctx.quadraticCurveTo(w * 0.4, h * 0.1, w, h * 0.45);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, 0);
    ctx.fill();
  } else if (biome === "mine") {
    ctx.fillStyle = "#8a6a3e";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5a3d24";
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.42, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c4a46a";
    ctx.fillRect(w * 0.18, h * 0.7, w * 0.64, 8);
  } else {
    ctx.fillStyle = "#c9a25a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#a37c38";
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.ellipse(rnd(i) * w, 80 + rnd(i + 2) * 180, 90, 16, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderPhoto(
  canvas: HTMLCanvasElement,
  contract: Contract,
  opticsLevel: number,
  raw: boolean,
  ppiName?: string,
) {
  const w = 720;
  const h = 420;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  fillSky(ctx, w, h, contract.biome);
  drawBiome(ctx, w, h, contract.biome, contract.seed);

  if (raw) {
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 70;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = "rgba(126,200,197,0.25)";
    ctx.fillRect(0, (Date.now() / 20) % h, w, 8);
  }

  ctx.fillStyle = "rgba(7,11,18,0.72)";
  ctx.fillRect(0, 0, w, 46);
  ctx.fillRect(0, h - 54, w, 54);
  ctx.fillStyle = "#e8a25a";
  ctx.font = "600 13px ui-monospace, monospace";
  ctx.fillText("КБ «СФЕРА»  ·  КА ЛАПКА-1  ·  ПН ОПТИКА", 16, 20);
  ctx.fillStyle = "#d7e0ea";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText(
    `${contract.title}  ·  ${fmtCoord(contract.lat, contract.lon)}  ·  ГСД ${GSD_BY_OPTICS[opticsLevel]} м`,
    16,
    38,
  );
  ctx.fillText(
    raw
      ? `СЫРОЙ ПОТОК  ·  облачность ${contract.cloud}%  ·  ждём сброс на ППИ`
      : `ПРОДУКТ L1  ·  ${ppiName ?? "ППИ"}  ·  облачность ${contract.cloud}%  ·  к продаже`,
    16,
    h - 30,
  );
  ctx.fillStyle = "#7ec8c5";
  ctx.fillText(raw ? "LEVEL 0 / UNCAL" : "LEVEL 1 / GEOREF", 16, h - 12);
}

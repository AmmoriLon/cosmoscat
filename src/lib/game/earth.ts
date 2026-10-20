export function makeEarthCanvases(w = 768, h = 384) {
  const day = document.createElement("canvas");
  const night = document.createElement("canvas");
  day.width = night.width = w;
  day.height = night.height = h;
  const dctx = day.getContext("2d");
  const nctx = night.getContext("2d");
  if (!dctx || !nctx) return { day, night };

  const ocean = dctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, "#7ec8e3");
  ocean.addColorStop(0.5, "#2f7eb5");
  ocean.addColorStop(1, "#7ec8e3");
  dctx.fillStyle = ocean;
  dctx.fillRect(0, 0, w, h);

  const lands: [number, number, number, number, string][] = [
    [0.52, 0.28, 0.42, 0.28, "#6fba5a"],
    [0.54, 0.48, 0.16, 0.28, "#c9a24a"],
    [0.18, 0.3, 0.22, 0.22, "#5aa35a"],
    [0.22, 0.55, 0.12, 0.22, "#7aa24a"],
    [0.82, 0.62, 0.12, 0.1, "#c2a056"],
    [0.78, 0.32, 0.08, 0.08, "#6fba5a"],
    [0.28, 0.12, 0.1, 0.08, "#e8f0f4"],
    [0.5, 0.9, 0.7, 0.12, "#eef4f7"],
  ];
  for (const [cx, cy, rx, ry, color] of lands) {
    dctx.fillStyle = color;
    dctx.beginPath();
    dctx.ellipse(cx * w, cy * h, rx * w, ry * h, 0, 0, Math.PI * 2);
    dctx.fill();
  }

  nctx.fillStyle = "#02040a";
  nctx.fillRect(0, 0, w, h);
  nctx.fillStyle = "#e8a25a";
  for (let i = 0; i < 80; i++) {
    nctx.globalAlpha = 0.35 + (i % 5) * 0.1;
    nctx.fillRect((i * 97) % w, 40 + ((i * 53) % (h - 80)), 2, 2);
  }
  nctx.globalAlpha = 1;
  return { day, night };
}

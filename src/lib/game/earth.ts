import { EARTH_R } from "./data";

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function landMask(lat: number, lon: number) {
  const blobs = [
    { lat: 52, lon: 70, rlat: 32, rlon: 78 },
    { lat: 8, lon: 22, rlat: 34, rlon: 22 },
    { lat: 48, lon: -100, rlat: 28, rlon: 38 },
    { lat: -16, lon: -62, rlat: 28, rlon: 18 },
    { lat: -25, lon: 134, rlat: 14, rlon: 18 },
    { lat: 64, lon: 105, rlat: 16, rlon: 40 },
    { lat: 72, lon: -42, rlat: 10, rlon: 18 },
    { lat: 20, lon: 78, rlat: 14, rlon: 14 },
    { lat: 35, lon: 138, rlat: 8, rlon: 10 },
    { lat: -82, lon: 0, rlat: 12, rlon: 180 },
  ];
  let d = 0;
  for (const b of blobs) {
    let dlon = lon - b.lon;
    if (dlon > 180) dlon -= 360;
    if (dlon < -180) dlon += 360;
    const nx = dlon / b.rlon;
    const ny = (lat - b.lat) / b.rlat;
    const v = 1 - Math.hypot(nx, ny);
    if (v > d) d = v;
  }
  const n = (hash(lat * 0.18, lon * 0.18) - 0.5) * 0.22;
  return d + n;
}

export function makeEarthCanvases(w = 1024, h = 512) {
  const day = document.createElement("canvas");
  const night = document.createElement("canvas");
  day.width = night.width = w;
  day.height = night.height = h;
  const dctx = day.getContext("2d")!;
  const nctx = night.getContext("2d")!;
  const dimg = dctx.createImageData(w, h);
  const nimg = nctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lat = 90 - (y / h) * 180;
      const lon = (x / w) * 360 - 180;
      const land = landMask(lat, lon);
      const ice = Math.abs(lat) > 72 || (Math.abs(lat) > 62 && land > 0.05);
      const i = (y * w + x) * 4;
      let r: number, g: number, b: number;
      if (ice) {
        r = 236;
        g = 244;
        b = 248;
      } else if (land > 0.08) {
        const t = Math.min(1, land);
        r = 118 + t * 62;
        g = 148 + t * 38;
        b = 86 + t * 16;
        if (lat < 22 && lat > -26 && land < 0.45) {
          r = 210;
          g = 176;
          b = 104;
        }
      } else {
        const deep = 0.72 + hash(x * 0.02, y * 0.02) * 0.2;
        r = 22 + 28 * deep;
        g = 92 + 48 * deep;
        b = 138 + 42 * deep;
      }
      dimg.data[i] = r;
      dimg.data[i + 1] = g;
      dimg.data[i + 2] = b;
      dimg.data[i + 3] = 255;

      const city =
        land > 0.2 &&
        Math.abs(lat) < 62 &&
        hash(Math.floor(lat * 3), Math.floor(lon * 3)) > 0.82;
      nimg.data[i] = city ? 255 : r * 0.08;
      nimg.data[i + 1] = city ? 170 : g * 0.08;
      nimg.data[i + 2] = city ? 70 : b * 0.18;
      nimg.data[i + 3] = 255;
    }
  }
  dctx.putImageData(dimg, 0, 0);
  nctx.putImageData(nimg, 0, 0);
  return { day, night };
}

export { EARTH_R };

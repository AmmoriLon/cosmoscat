import {
  APPROACH_DEG,
  EARTH_DAY_S,
  EARTH_R,
  IMAGE_WINDOW_DEG,
  INC_RAD,
  ORBIT_PERIOD_S,
  PPI_WINDOW_DEG,
  RAAN_RAD,
  SAT_R,
} from "./data";
import type { PPI } from "./types";

export function wrapLon(lon: number) {
  let x = lon;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

export function satEci(anomaly: number) {
  const u = anomaly;
  const i = INC_RAD;
  const o = RAAN_RAD;
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const ci = Math.cos(i);
  const si = Math.sin(i);
  const co = Math.cos(o);
  const so = Math.sin(o);
  const x = SAT_R * (co * cu - so * su * ci);
  const y = SAT_R * (su * si);
  const z = SAT_R * (so * cu + co * su * ci);
  return { x, y, z };
}

export function orbitPoints(segments = 160) {
  const pts: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(satEci((i / segments) * Math.PI * 2));
  }
  return pts;
}

export function latLonToXyz(lat: number, lon: number, r = EARTH_R) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const cl = Math.cos(la);
  return {
    x: r * cl * Math.cos(lo),
    y: r * Math.sin(la),
    z: r * cl * Math.sin(lo),
  };
}

export function rotateY(p: { x: number; y: number; z: number }, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

export function eciToLatLon(x: number, y: number, z: number, earthAngle: number) {
  const p = rotateY({ x, y, z }, -earthAngle);
  const r = Math.hypot(p.x, p.y, p.z);
  const lat = (Math.asin(p.y / r) * 180) / Math.PI;
  const lon = wrapLon((Math.atan2(p.z, p.x) * 180) / Math.PI);
  return { lat, lon };
}

export function angularDistance(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
) {
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dL = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin((p2 - p1) / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dL / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(s))) * 180) / Math.PI;
}

export function inWindow(
  satLat: number,
  satLon: number,
  lat: number,
  lon: number,
  deg: number,
) {
  return angularDistance(satLat, satLon, lat, lon) <= deg;
}

export function imagingIds(
  satLat: number,
  satLon: number,
  targets: { id: string; lat: number; lon: number }[],
  deg = IMAGE_WINDOW_DEG,
) {
  return targets.filter((t) => inWindow(satLat, satLon, t.lat, t.lon, deg)).map((t) => t.id);
}

export function approachIds(
  satLat: number,
  satLon: number,
  targets: { id: string; lat: number; lon: number }[],
) {
  return targets
    .filter(
      (t) =>
        inWindow(satLat, satLon, t.lat, t.lon, APPROACH_DEG) &&
        !inWindow(satLat, satLon, t.lat, t.lon, IMAGE_WINDOW_DEG),
    )
    .map((t) => t.id);
}

export function ppiInView(satLat: number, satLon: number, stations: PPI[] = []) {
  return stations
    .filter((p) => inWindow(satLat, satLon, p.lat, p.lon, PPI_WINDOW_DEG))
    .map((p) => p.id);
}

export function etaToTarget(
  anomaly: number,
  earthAngle: number,
  lat: number,
  lon: number,
) {
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * ORBIT_PERIOD_S;
    const a = anomaly + (t * Math.PI * 2) / ORBIT_PERIOD_S;
    const ea = earthAngle + (t * Math.PI * 2) / EARTH_DAY_S;
    const p = satEci(a);
    const ll = eciToLatLon(p.x, p.y, p.z, ea);
    if (inWindow(ll.lat, ll.lon, lat, lon, IMAGE_WINDOW_DEG)) return t;
  }
  return null;
}

export function fmtCoord(lat: number, lon: number) {
  const ns = lat >= 0 ? "с.ш." : "ю.ш.";
  const ew = lon >= 0 ? "в.д." : "з.д.";
  return `${Math.abs(lat).toFixed(2)}° ${ns}  ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

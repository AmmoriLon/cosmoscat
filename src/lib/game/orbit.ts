import {
  APPROACH_DEG,
  EARTH_DAY_S,
  EARTH_R,
  IMAGE_WINDOW_DEG,
  ORBITS,
  PPI_WINDOW_DEG,
  orbitElements,
} from "./data";
import type { Craft, OrbitId, PPI } from "./types";

export function wrapLon(lon: number) {
  let x = lon;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

export function satRadius(anomaly: number, orbitId: OrbitId = "sso535") {
  const { a, e } = orbitElements(orbitId);
  if (e <= 0.0001) return a;
  return (a * (1 - e * e)) / (1 + e * Math.cos(anomaly));
}

export function satEci(anomaly: number, orbitId: OrbitId = "sso535") {
  const spec = ORBITS[orbitId];
  const r = satRadius(anomaly, orbitId);
  const u = anomaly;
  const i = (spec.inc * Math.PI) / 180;
  const o = (spec.raan * Math.PI) / 180;
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const ci = Math.cos(i);
  const si = Math.sin(i);
  const co = Math.cos(o);
  const so = Math.sin(o);
  return {
    x: r * (co * cu - so * su * ci),
    y: r * (su * si),
    z: r * (so * cu + co * su * ci),
  };
}

export function orbitPoints(orbitId: OrbitId = "sso535", segments = 256) {
  const pts: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(satEci((i / segments) * Math.PI * 2, orbitId));
  }
  return pts;
}

export function craftAnomaly(craft: Pick<Craft, "orbit" | "phase" | "launchedAt">, timeSec: number) {
  const period = ORBITS[craft.orbit].period;
  const age = Math.max(0, timeSec - craft.launchedAt);
  return (craft.phase + (age / period) * Math.PI * 2) % (Math.PI * 2);
}

export function earthAngleAt(timeSec: number) {
  return ((timeSec / EARTH_DAY_S) * Math.PI * 2) % (Math.PI * 2);
}

export function altKm(anomaly: number, orbitId: OrbitId) {
  const r = satRadius(anomaly, orbitId);
  return ((r - EARTH_R) / EARTH_R) * 6371;
}

export function craftTelemetry(craft: Craft, timeSec: number) {
  const anomaly = craftAnomaly(craft, timeSec);
  const angle = earthAngleAt(timeSec);
  const p = satEci(anomaly, craft.orbit);
  const ll = eciToLatLon(p.x, p.y, p.z, angle);
  const r = satRadius(anomaly, craft.orbit);
  const { a, e, spec } = orbitElements(craft.orbit);
  const thermalHit = craft.events.some((ev) => ev.kind === "thermal");
  const hydroHit = craft.events.some((ev) => ev.kind === "hydro" || ev.kind === "gyro");
  const solarHit = craft.events.some((ev) => ev.kind === "solar");
  const battHit = craft.events.some((ev) => ev.kind === "battery");
  const radioHit = craft.events.some((ev) => ev.kind === "radio");
  const shade = (Math.sin(anomaly + angle) + 1) / 2;
  const baseTemp = 4 + (r - EARTH_R) * 38 + shade * 22;
  return {
    anomaly,
    lat: ll.lat,
    lon: ll.lon,
    altKm: spec.periKm + ((r - (EARTH_R + spec.periAlt)) / Math.max(0.0001, spec.apoAlt - spec.periAlt || spec.periAlt)) * (spec.apoKm - spec.periKm),
    periKm: spec.periKm,
    apoKm: spec.apoKm,
    ecc: e,
    inc: spec.inc,
    period: spec.period,
    speed: 7.67 * Math.sqrt(a / r),
    tempC: baseTemp + (thermalHit ? 28 : 0),
    busV: 28.4 - (battHit ? 6.2 : 0) - (solarHit ? 3.1 : 0) - shade * 1.4,
    attitude: hydroHit ? "дрейф" : "стабилен",
    radio: radioHit ? "узкая полоса" : "номинал",
    power: solarHit ? "недолёт СБ" : "номинал",
    thermal: thermalHit ? "перегрев" : "в допуске",
  };
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

export function angularDistance(aLat: number, aLon: number, bLat: number, bLon: number) {
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dL = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin((p2 - p1) / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dL / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(s))) * 180) / Math.PI;
}

export function orbitCanSee(orbitId: OrbitId, lat: number) {
  return Math.abs(lat) <= ORBITS[orbitId].maxLat + 0.2;
}

export function inWindow(satLat: number, satLon: number, lat: number, lon: number, deg: number) {
  return angularDistance(satLat, satLon, lat, lon) <= deg;
}

export function imagingIds(
  satLat: number,
  satLon: number,
  targets: { id: string; lat: number; lon: number }[],
  orbitId: OrbitId = "sso535",
  deg = IMAGE_WINDOW_DEG,
) {
  return targets
    .filter((t) => orbitCanSee(orbitId, t.lat) && inWindow(satLat, satLon, t.lat, t.lon, deg))
    .map((t) => t.id);
}

export function approachIds(
  satLat: number,
  satLon: number,
  targets: { id: string; lat: number; lon: number }[],
  orbitId: OrbitId = "sso535",
) {
  return targets
    .filter(
      (t) =>
        orbitCanSee(orbitId, t.lat) &&
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
  orbitId: OrbitId = "sso535",
) {
  if (!orbitCanSee(orbitId, lat)) return null;
  const period = ORBITS[orbitId].period;
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * period;
    const a = anomaly + (t * Math.PI * 2) / period;
    const ea = earthAngle + (t * Math.PI * 2) / EARTH_DAY_S;
    const p = satEci(a, orbitId);
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

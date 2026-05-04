/**
 * `ZonesPayload` (raw bridge shape) → Kaiord-domain `IncomingMap`.
 *
 * Per design D5/D6 (threshold scalars) and D-FB1/D-FB6/D-FB7 (full
 * band tables). Per-sport HR fallback chain is implemented here;
 * watts→%FTP and pace inversion live in `sync-zones-band-mappers.ts`.
 */
import type { HrBandBlock, ZonesPayload } from "../../types/coaching-zones";
import type { IncomingMap } from "./sync-zones-band-mappers";
import {
  setCyclingPowerBands,
  setHrBands,
  setPaceBands,
} from "./sync-zones-band-mappers";

export type { IncomingMap } from "./sync-zones-band-mappers";

const minSecToSeconds = (ms: { min: number; sec: number }): number =>
  ms.min * 60 + ms.sec;

const setIfPositive = (
  map: IncomingMap,
  key: Parameters<IncomingMap["set"]>[0],
  value: number | undefined
): void => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    map.set(key, value);
  }
};

const pickFtp = (
  cycling: { z4Upper?: number; z5Lower?: number } | undefined
): number | undefined => {
  if (!cycling) return undefined;
  if (typeof cycling.z4Upper === "number" && cycling.z4Upper > 0) {
    return cycling.z4Upper;
  }
  return cycling.z5Lower;
};

const hasAnyBand = (block: HrBandBlock | undefined): boolean =>
  Boolean(block && (block.z1 || block.z2 || block.z3 || block.z4 || block.z5));

const resolveHrBands = (
  payload: ZonesPayload,
  sport: "cycling" | "running" | "swimming"
): HrBandBlock | undefined => {
  const specific = payload.hrZones?.[sport];
  if (hasAnyBand(specific)) return specific;
  const generic = payload.hrZones?.generic;
  if (hasAnyBand(generic)) return generic;
  return undefined;
};

const setThresholdScalars = (out: IncomingMap, payload: ZonesPayload): void => {
  setIfPositive(out, "bodyWeight", payload.physiological?.weight);
  setIfPositive(out, "heartRate.max", payload.physiological?.bpmMax);
  setIfPositive(out, "cycling.thresholds.ftp", pickFtp(payload.paces?.cycling));
  setIfPositive(
    out,
    "cycling.thresholds.lthr",
    payload.hrZones?.cycling?.z4Upper
  );
  setIfPositive(
    out,
    "running.thresholds.lthr",
    payload.hrZones?.running?.z4Upper
  );
  const runZ4 = payload.paces?.running?.z4Upper;
  if (runZ4) {
    out.set("running.thresholds.thresholdPaceSecPerKm", minSecToSeconds(runZ4));
  }
  const swimZ4 = payload.paces?.swimming?.z4Upper;
  if (swimZ4) {
    out.set("swimming.thresholds.cssPaceSecPer100m", minSecToSeconds(swimZ4));
  }
};

const setBandEntries = (out: IncomingMap, payload: ZonesPayload): void => {
  for (const sport of ["cycling", "running", "swimming"] as const) {
    setHrBands(out, sport, resolveHrBands(payload, sport));
  }
  setCyclingPowerBands(out, payload.paces?.cycling);
  setPaceBands(out, "running", payload.paces?.running);
  setPaceBands(out, "swimming", payload.paces?.swimming);
};

export const mapPayloadToIncoming = (payload: ZonesPayload): IncomingMap => {
  const out: IncomingMap = new Map();
  setThresholdScalars(out, payload);
  setBandEntries(out, payload);
  return out;
};

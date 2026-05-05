/**
 * `ZonesPayload` (raw bridge shape) → Kaiord-domain `IncomingMap`.
 *
 * Per design D5/D6 (threshold scalars) and D-FB1/D-FB6/D-FB7 (full
 * band tables). The Specific → Generic → skip HR fallback lives in
 * `sync-zones-hr-fallback.ts`; watts→%FTP and pace inversion live
 * in `sync-zones-band-mappers.ts`.
 */
import type { ZonesPayload } from "../../types/coaching-zones";
import type { IncomingMap } from "./sync-zones-band-mappers";
import {
  setCyclingPowerBands,
  setHrBands,
  setPaceBands,
} from "./sync-zones-band-mappers";
import { resolveHrBands, resolveLthrScalar } from "./sync-zones-hr-fallback";

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

const setThresholdScalars = (out: IncomingMap, payload: ZonesPayload): void => {
  setIfPositive(out, "bodyWeight", payload.physiological?.weight);
  setIfPositive(out, "heartRate.max", payload.physiological?.bpmMax);
  setIfPositive(out, "cycling.thresholds.ftp", pickFtp(payload.paces?.cycling));
  for (const sport of ["cycling", "running", "swimming"] as const) {
    setIfPositive(
      out,
      `${sport}.thresholds.lthr`,
      resolveLthrScalar(payload, sport)
    );
  }
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

/**
 * `ZonesPayload` (raw bridge shape) → Kaiord-domain `IncomingMap`.
 *
 * Mapping conventions are fixed by design D5/D6:
 *   - cycling FTP: z4Upper wins; z5Lower fallback only when z4Upper is
 *     absent OR === 0 (semantically "not set" for a watt threshold).
 *   - per-sport LTHR: 1:1 from `hrZones.<sport>.z4Upper`.
 *   - running/swimming threshold pace: minutes:seconds → integer seconds.
 *   - bodyWeight + maxHeartRate: from the `physiological` block ONLY
 *     (the ping payload's weight/bpm_max is NOT consulted by zones-sync).
 */
import type { FieldKey, ZonesPayload } from "../../types/coaching-zones";

export type IncomingMap = Map<FieldKey, number>;

const minSecToSeconds = (ms: { min: number; sec: number }): number =>
  ms.min * 60 + ms.sec;

const setIfPositive = (
  map: IncomingMap,
  key: FieldKey,
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

export const mapPayloadToIncoming = (payload: ZonesPayload): IncomingMap => {
  const out: IncomingMap = new Map();
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
  return out;
};

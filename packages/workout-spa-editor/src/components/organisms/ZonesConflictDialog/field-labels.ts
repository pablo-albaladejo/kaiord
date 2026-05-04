/**
 * Static FieldKey → human label map.
 *
 * The conflict dialog renders these as React children (auto-escaped),
 * NEVER from any T2G-controlled string. This is the load-bearing line
 * that keeps `dangerouslySetInnerHTML` unnecessary in the dialog —
 * never widen a label by interpolating an external value. Band-level
 * entries are generated at module-load time via
 * `field-labels-bands.ts`; every string literal there is hardcoded.
 */
import type { FieldKey } from "../../../types/coaching-zones";
import { buildBandLabels, buildBandUnits } from "./field-labels-bands";

export const FIELD_LABELS: Record<FieldKey, string> = {
  "cycling.thresholds.ftp": "FTP",
  "cycling.thresholds.lthr": "Cycling LTHR",
  "running.thresholds.lthr": "Running LTHR",
  "running.thresholds.thresholdPaceSecPerKm": "Running threshold pace",
  "swimming.thresholds.cssPaceSecPer100m": "Swimming CSS",
  "heartRate.max": "Max HR",
  bodyWeight: "Body weight",
  ...buildBandLabels(),
};

const PACE_FIELDS: ReadonlySet<FieldKey> = new Set([
  "running.thresholds.thresholdPaceSecPerKm",
  "swimming.thresholds.cssPaceSecPer100m",
] as const);

const formatPace = (sec: number, suffix: string): string => {
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, "0")} ${suffix}`;
};

const UNITS: Record<FieldKey, string> = {
  "cycling.thresholds.ftp": "W",
  "cycling.thresholds.lthr": "bpm",
  "running.thresholds.lthr": "bpm",
  "running.thresholds.thresholdPaceSecPerKm": "/km",
  "swimming.thresholds.cssPaceSecPer100m": "/100m",
  "heartRate.max": "bpm",
  bodyWeight: "kg",
  ...buildBandUnits(),
};

const PACE_BAND_RE =
  /^(running|swimming)\.paceZones\.z[1-5]\.(minPace|maxPace)$/;

export const formatFieldValue = (field: FieldKey, value: number): string => {
  if (PACE_FIELDS.has(field)) return formatPace(value, UNITS[field]);
  if (PACE_BAND_RE.test(field)) return formatPace(value, UNITS[field]);
  return `${value} ${UNITS[field]}`.trim();
};

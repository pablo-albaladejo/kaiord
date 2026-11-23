/**
 * FieldKey → human label, read from the `zones` dictionary.
 *
 * The conflict dialog renders these as React children (auto-escaped),
 * NEVER from any T2G-controlled string. This is the load-bearing line
 * that keeps `dangerouslySetInnerHTML` unnecessary in the dialog —
 * never widen a label by interpolating an external value. Band-level
 * labels are composed in `field-labels-bands.ts` from dictionary parts.
 */
import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type {
  BandFieldKey,
  FieldKey,
  ThresholdFieldKey,
} from "../../../types/coaching-zones";
import {
  bandLabel,
  buildBandFieldKeys,
  buildBandUnits,
} from "./field-labels-bands";

const THRESHOLD_FIELDS: ReadonlyArray<ThresholdFieldKey> = [
  "cycling.thresholds.ftp",
  "cycling.thresholds.lthr",
  "running.thresholds.lthr",
  "running.thresholds.thresholdPaceSecPerKm",
  "swimming.thresholds.lthr",
  "swimming.thresholds.cssPaceSecPer100m",
  "heartRate.max",
  "bodyWeight",
];

export const FIELD_KEYS: ReadonlyArray<FieldKey> = [
  ...THRESHOLD_FIELDS,
  ...buildBandFieldKeys(),
];

const isThreshold = (field: FieldKey): field is ThresholdFieldKey =>
  (THRESHOLD_FIELDS as ReadonlyArray<FieldKey>).includes(field);

export const fieldLabel = (
  field: FieldKey,
  t: Translate = getTranslate("zones")
): string =>
  isThreshold(field)
    ? t(`conflict.field.${field}`)
    : bandLabel(field as BandFieldKey, t);

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
  "swimming.thresholds.lthr": "bpm",
  "swimming.thresholds.cssPaceSecPer100m": "/100m",
  "heartRate.max": "bpm",
  bodyWeight: "kg",
  ...buildBandUnits(),
};

const PACE_BAND_RE =
  /^(running|swimming)\.paceZones\.z[1-5]\.(minPace|maxPace)$/;

export const formatFieldValue = (
  field: FieldKey,
  value: number,
  hrUnit: string = getTranslate("common")("units.hr")
): string => {
  if (PACE_FIELDS.has(field)) return formatPace(value, UNITS[field]);
  if (PACE_BAND_RE.test(field)) return formatPace(value, UNITS[field]);
  // "bpm" in UNITS is the data token for a heart-rate field, not display text.
  const unit = UNITS[field] === "bpm" ? hrUnit : UNITS[field];
  return `${value} ${unit}`.trim();
};

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { Units } from "../../../lib/units/units";
import { formatPaceFromMps, runPaceLabel } from "../../../lib/units/units";

/** Finite-number predicate used by every target formatter below. */
const isValidNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

type TargetValue = Record<string, unknown>;

const asRecord = (value: unknown): TargetValue | null =>
  value !== null && typeof value === "object" ? (value as TargetValue) : null;

export const formatPowerTarget = (
  value: unknown,
  t: Translate = getTranslate("editor")
): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return t("target.power");
  if (v.unit === "watts" && isValidNumber(v.value)) return `${v.value}W`;
  if (v.unit === "percent_ftp" && isValidNumber(v.value))
    return `${v.value}% FTP`;
  if (v.unit === "zone" && isValidNumber(v.value))
    return t("target.zone", { n: v.value });
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    return `${v.min}-${v.max}W`;
  return t("target.power");
};

export const formatHeartRateTarget = (
  value: unknown,
  t: Translate = getTranslate("editor")
): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return t("target.heartRate");
  if (v.unit === "bpm" && isValidNumber(v.value)) return `${v.value} bpm`;
  if (v.unit === "percent_max" && isValidNumber(v.value))
    return `${v.value}% max`;
  if (v.unit === "zone" && isValidNumber(v.value))
    return t("target.zone", { n: v.value });
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    return `${v.min}-${v.max} bpm`;
  return t("target.heartRate");
};

export const formatCadenceTarget = (
  value: unknown,
  t: Translate = getTranslate("editor")
): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return t("target.cadence");
  if (v.unit === "rpm" && isValidNumber(v.value)) return `${v.value} rpm`;
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    return `${v.min}-${v.max} rpm`;
  return t("target.cadence");
};

export const formatPaceTarget = (
  value: unknown,
  units: Units = "metric",
  t: Translate = getTranslate("editor")
): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return t("target.pace");
  const label = runPaceLabel(units);
  if (v.unit === "mps" && isValidNumber(v.value))
    return `${formatPaceFromMps(v.value, units)} ${label}`;
  if (v.unit === "zone" && isValidNumber(v.value))
    return t("target.zone", { n: v.value });
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    // In pace, lower m/s = slower (higher min/km); show faster-slower.
    return `${formatPaceFromMps(v.max, units)}-${formatPaceFromMps(v.min, units)} ${label}`;
  return t("target.pace");
};

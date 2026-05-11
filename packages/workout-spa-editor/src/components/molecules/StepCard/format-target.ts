import type { WorkoutStep } from "../../../types/krd";

/** Finite-number predicate used by every target formatter below. */
const isValidNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Convert meters per second to a `m:ss min/km` pace string. */
const mpsToMinPerKm = (mps: number): string => {
  if (mps <= 0 || !isFinite(mps)) return "--:--";
  const minPerKm = 1000 / (mps * 60);
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

type TargetValue = Record<string, unknown>;

const asRecord = (value: unknown): TargetValue | null =>
  value !== null && typeof value === "object" ? (value as TargetValue) : null;

export const formatPowerTarget = (value: unknown): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return "Power";
  if (v.unit === "watts" && isValidNumber(v.value)) return `${v.value}W`;
  if (v.unit === "percent_ftp" && isValidNumber(v.value))
    return `${v.value}% FTP`;
  if (v.unit === "zone" && isValidNumber(v.value)) return `Zone ${v.value}`;
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    return `${v.min}-${v.max}W`;
  return "Power";
};

export const formatHeartRateTarget = (value: unknown): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return "Heart Rate";
  if (v.unit === "bpm" && isValidNumber(v.value)) return `${v.value} bpm`;
  if (v.unit === "percent_max" && isValidNumber(v.value))
    return `${v.value}% max`;
  if (v.unit === "zone" && isValidNumber(v.value)) return `Zone ${v.value}`;
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    return `${v.min}-${v.max} bpm`;
  return "Heart Rate";
};

export const formatCadenceTarget = (value: unknown): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return "Cadence";
  if (v.unit === "rpm" && isValidNumber(v.value)) return `${v.value} rpm`;
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    return `${v.min}-${v.max} rpm`;
  return "Cadence";
};

export const formatPaceTarget = (value: unknown): string => {
  const v = asRecord(value);
  if (!v || !("unit" in v)) return "Pace";
  if (v.unit === "mps" && isValidNumber(v.value))
    return `${mpsToMinPerKm(v.value)} min/km`;
  if (v.unit === "zone" && isValidNumber(v.value)) return `Zone ${v.value}`;
  if (v.unit === "range" && isValidNumber(v.min) && isValidNumber(v.max))
    // In pace, lower m/s = slower (higher min/km); show faster-slower.
    return `${mpsToMinPerKm(v.max)}-${mpsToMinPerKm(v.min)} min/km`;
  return "Pace";
};

/** Top-level target formatter used by StepCard. */
export const formatTarget = (step: WorkoutStep): string => {
  const { target, targetType } = step;
  if (targetType === "open") return "Open";
  if (!("value" in target)) return targetType.replace(/_/g, " ");
  const value = target.value;
  switch (targetType) {
    case "power":
      return formatPowerTarget(value);
    case "heart_rate":
      return formatHeartRateTarget(value);
    case "cadence":
      return formatCadenceTarget(value);
    case "pace":
      return formatPaceTarget(value);
    default:
      return targetType.replace(/_/g, " ");
  }
};

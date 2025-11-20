import { isValidNumber } from "./format-helpers";

/**
 * Format cadence target for display
 */
export const formatCadenceTarget = (value: unknown): string => {
  if (typeof value !== "object" || value === null) {
    return "Cadence";
  }

  const v = value as Record<string, unknown>;

  if (!("unit" in v)) {
    return "Cadence";
  }

  if (v.unit === "rpm" && "value" in v && isValidNumber(v.value)) {
    return `${v.value} rpm`;
  }
  if (
    v.unit === "range" &&
    "min" in v &&
    "max" in v &&
    isValidNumber(v.min) &&
    isValidNumber(v.max)
  ) {
    return `${v.min}-${v.max} rpm`;
  }

  return "Cadence";
};

/**
 * Convert meters per second to min/km format
 */
const convertMpsToMinPerKm = (mps: number): string => {
  const minPerKm = 1000 / (mps * 60);
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  if (seconds === 60) {
    return `${minutes + 1}:00`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format pace target for display
 */
export const formatPaceTarget = (value: unknown): string => {
  if (typeof value !== "object" || value === null) {
    return "Pace";
  }

  const v = value as Record<string, unknown>;

  if (!("unit" in v)) {
    return "Pace";
  }

  if (v.unit === "mps" && "value" in v && isValidNumber(v.value)) {
    return `${convertMpsToMinPerKm(v.value)} min/km`;
  }
  if (v.unit === "zone" && "value" in v && isValidNumber(v.value)) {
    return `Zone ${v.value}`;
  }
  if (
    v.unit === "range" &&
    "min" in v &&
    "max" in v &&
    isValidNumber(v.min) &&
    isValidNumber(v.max)
  ) {
    // In pace, lower m/s = slower (higher min/km), so we swap to show faster-slower
    return `${convertMpsToMinPerKm(v.max)}-${convertMpsToMinPerKm(v.min)} min/km`;
  }

  return "Pace";
};

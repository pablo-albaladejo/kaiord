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

  if (v.unit === "min_per_km" && "value" in v && isValidNumber(v.value)) {
    let minutes = Math.floor(v.value);
    let seconds = Math.round((v.value - minutes) * 60);
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
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
    return `${v.min}-${v.max} min/km`;
  }

  return "Pace";
};

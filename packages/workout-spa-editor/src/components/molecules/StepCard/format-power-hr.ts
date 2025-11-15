import { isValidNumber } from "./format-helpers";

/**
 * Format power target for display
 */
export const formatPowerTarget = (value: unknown): string => {
  if (typeof value !== "object" || value === null) {
    return "Power";
  }

  const v = value as Record<string, unknown>;

  if (!("unit" in v)) {
    return "Power";
  }

  if (v.unit === "watts" && "value" in v && isValidNumber(v.value)) {
    return `${v.value}W`;
  }
  if (v.unit === "percent_ftp" && "value" in v && isValidNumber(v.value)) {
    return `${v.value}% FTP`;
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
    return `${v.min}-${v.max}W`;
  }

  return "Power";
};

/**
 * Format heart rate target for display
 */
export const formatHeartRateTarget = (value: unknown): string => {
  if (typeof value !== "object" || value === null) {
    return "Heart Rate";
  }

  const v = value as Record<string, unknown>;

  if (!("unit" in v)) {
    return "Heart Rate";
  }

  if (v.unit === "bpm" && "value" in v && isValidNumber(v.value)) {
    return `${v.value} bpm`;
  }
  if (v.unit === "percent_max" && "value" in v && isValidNumber(v.value)) {
    return `${v.value}% max`;
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
    return `${v.min}-${v.max} bpm`;
  }

  return "Heart Rate";
};

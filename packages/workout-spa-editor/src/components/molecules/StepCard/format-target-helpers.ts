/**
<<<<<<< HEAD
 * Format target helpers - Re-exports for backward compatibility
 */
export { formatCadenceTarget, formatPaceTarget } from "./format-cadence-pace";
export { formatHeartRateTarget, formatPowerTarget } from "./format-power-hr";
=======
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

  if (v.unit === "watts" && "value" in v) {
    return `${v.value}W`;
  }
  if (v.unit === "percent_ftp" && "value" in v) {
    return `${v.value}% FTP`;
  }
  if (v.unit === "zone" && "value" in v) {
    return `Zone ${v.value}`;
  }
  if (v.unit === "range" && "min" in v && "max" in v) {
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

  if (v.unit === "bpm" && "value" in v) {
    return `${v.value} bpm`;
  }
  if (v.unit === "percent_max" && "value" in v) {
    return `${v.value}% max`;
  }
  if (v.unit === "zone" && "value" in v) {
    return `Zone ${v.value}`;
  }
  if (v.unit === "range" && "min" in v && "max" in v) {
    return `${v.min}-${v.max} bpm`;
  }

  return "Heart Rate";
};

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

  if (v.unit === "rpm" && "value" in v) {
    return `${v.value} rpm`;
  }
  if (v.unit === "range" && "min" in v && "max" in v) {
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

  if (v.unit === "min_per_km" && "value" in v && typeof v.value === "number") {
    const minutes = Math.floor(v.value);
    const seconds = Math.round((v.value - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
  }
  if (v.unit === "zone" && "value" in v) {
    return `Zone ${v.value}`;
  }
  if (v.unit === "range" && "min" in v && "max" in v) {
    return `${v.min}-${v.max} min/km`;
  }

  return "Pace";
};
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)

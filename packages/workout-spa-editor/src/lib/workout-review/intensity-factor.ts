import type { Target } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";

const ZONE_MIDPOINTS = [0.45, 0.65, 0.825, 0.975, 1.15] as const;
const PER_100M_METERS = 100;
const PER_KM_METERS = 1000;
const MAX_ZONE_INDEX = 4;

const zoneMidpoint = (zone: number): number =>
  ZONE_MIDPOINTS[Math.min(Math.max(zone, 1), MAX_ZONE_INDEX + 1) - 1]!;

function powerFactor(
  value: Target & { type: "power" },
  thresholds: SportThresholds
): number | null {
  const v = value.value;
  if (v.unit === "percent_ftp") return v.value / 100;
  if (v.unit === "watts" && thresholds.ftp) return v.value / thresholds.ftp;
  if (v.unit === "zone") return zoneMidpoint(v.value);
  return null;
}

function hrFactor(
  value: Target & { type: "heart_rate" },
  thresholds: SportThresholds
): number | null {
  const v = value.value;
  if (v.unit === "bpm" && thresholds.lthr) return v.value / thresholds.lthr;
  if (v.unit === "zone") return zoneMidpoint(v.value);
  return null;
}

function paceFactor(
  value: Target & { type: "pace" },
  thresholds: SportThresholds
): number | null {
  const v = value.value;
  if (v.unit === "mps" && thresholds.thresholdPace) {
    const metersPerLap =
      thresholds.paceUnit === "min_per_100m" ? PER_100M_METERS : PER_KM_METERS;
    return v.value / (metersPerLap / thresholds.thresholdPace);
  }
  if (v.unit === "zone") return zoneMidpoint(v.value);
  return null;
}

/**
 * Fraction-of-threshold intensity used for the TSS approximation. Reuses the
 * same fraction math as `classifyTargetZone`; returns null when not computable.
 */
export function stepIntensityFactor(
  target: Target,
  thresholds: SportThresholds
): number | null {
  if (target.type === "power") return powerFactor(target, thresholds);
  if (target.type === "heart_rate") return hrFactor(target, thresholds);
  if (target.type === "pace") return paceFactor(target, thresholds);
  return null;
}

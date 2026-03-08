/**
 * Zone field getters/setters for cascade logic.
 *
 * For power zones, uses ceil/floor rounding to ensure that
 * converting watts→percent→watts preserves at least 1W gaps.
 */

import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

type ZoneRowData = HeartRateZone | PowerZone | PaceZone;

export function getRealValue(
  zone: ZoneRowData,
  field: "min" | "max",
  type: string,
  threshold?: number
): number {
  if (type === "heartRate") {
    const hr = zone as HeartRateZone;
    return field === "min" ? hr.minBpm : hr.maxBpm;
  }
  if (type === "power") {
    const pw = zone as PowerZone;
    const pct = field === "min" ? pw.minPercent : pw.maxPercent;
    return threshold ? Math.round((threshold * pct) / 100) : pct;
  }
  const p = zone as PaceZone;
  return field === "min" ? p.minPace : p.maxPace;
}

export function setRealValue(
  zones: Array<ZoneRowData>,
  idx: number,
  field: "min" | "max",
  value: number,
  type: string,
  threshold?: number
): void {
  const z = zones[idx];
  if (type === "heartRate") {
    (z as Record<string, unknown>)[field === "min" ? "minBpm" : "maxBpm"] =
      value;
  } else if (type === "power") {
    const pct = threshold ? wattsToPercent(value, threshold, field) : value;
    (z as Record<string, unknown>)[
      field === "min" ? "minPercent" : "maxPercent"
    ] = pct;
  } else {
    (z as Record<string, unknown>)[field === "min" ? "minPace" : "maxPace"] =
      value;
  }
}

function wattsToPercent(
  watts: number,
  threshold: number,
  field: "min" | "max"
): number {
  const exact = (watts / threshold) * 100;
  return field === "min" ? Math.ceil(exact) : Math.floor(exact);
}

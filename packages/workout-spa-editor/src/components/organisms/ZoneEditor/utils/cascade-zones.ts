/**
 * Zone cascade logic
 *
 * When a zone boundary changes, recursively adjusts subsequent
 * zones to maintain contiguity and min < max invariant.
 */

import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

type ZoneRowData = HeartRateZone | PowerZone | PaceZone;

export function cascadeToNeighbors(
  zones: Array<ZoneRowData>,
  index: number,
  field: "min" | "max",
  type: string,
  threshold?: number
): Array<ZoneRowData> {
  const result = zones.map((z) => ({ ...z }));
  if (field === "max") cascadeForward(result, index, type, threshold);
  if (field === "min") cascadeBackward(result, index, type, threshold);
  return result;
}

function cascadeForward(
  zones: Array<ZoneRowData>,
  from: number,
  type: string,
  threshold?: number
): void {
  for (let i = from; i < zones.length - 1; i++) {
    const curMax = getRealValue(zones[i], "max", type, threshold);
    const nextMin = curMax + 1;
    setRealValue(zones, i + 1, "min", nextMin, type, threshold);
    const newNextMin = getRealValue(zones[i + 1], "min", type, threshold);
    const nextMax = getRealValue(zones[i + 1], "max", type, threshold);
    if (newNextMin <= nextMax) break;
    setRealValue(zones, i + 1, "max", newNextMin + 1, type, threshold);
  }
}

function cascadeBackward(
  zones: Array<ZoneRowData>,
  from: number,
  type: string,
  threshold?: number
): void {
  for (let i = from; i > 0; i--) {
    const curMin = getRealValue(zones[i], "min", type, threshold);
    const prevMax = curMin - 1;
    setRealValue(zones, i - 1, "max", prevMax, type, threshold);
    const newPrevMax = getRealValue(zones[i - 1], "max", type, threshold);
    const prevMin = getRealValue(zones[i - 1], "min", type, threshold);
    if (prevMin <= newPrevMax) break;
    setRealValue(zones, i - 1, "min", newPrevMax - 1, type, threshold);
  }
}

function getRealValue(
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

function setRealValue(
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
    const pct = threshold ? Math.round((value / threshold) * 100) : value;
    (z as Record<string, unknown>)[
      field === "min" ? "minPercent" : "maxPercent"
    ] = pct;
  } else {
    (z as Record<string, unknown>)[field === "min" ? "minPace" : "maxPace"] =
      value;
  }
}

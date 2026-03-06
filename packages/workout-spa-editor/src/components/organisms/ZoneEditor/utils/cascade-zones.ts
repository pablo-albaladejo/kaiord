/**
 * Zone cascade logic
 *
 * When a zone boundary changes, adjusts the adjacent zone
 * to maintain contiguity (no gaps or overlaps).
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
  const result = [...zones];
  if (field === "max" && index < zones.length - 1) {
    const next = adjacentValue(result[index], "max", type, threshold, 1);
    result[index + 1] = applyAdjacent(result[index + 1], "min", next, type, threshold);
  }
  if (field === "min" && index > 0) {
    const prev = adjacentValue(result[index], "min", type, threshold, -1);
    result[index - 1] = applyAdjacent(result[index - 1], "max", prev, type, threshold);
  }
  return result;
}

function adjacentValue(
  zone: ZoneRowData,
  fromField: "min" | "max",
  type: string,
  threshold?: number,
  offset: number = 0
): number {
  if (type === "heartRate") {
    const hr = zone as HeartRateZone;
    return (fromField === "max" ? hr.maxBpm : hr.minBpm) + offset;
  }
  if (type === "power") {
    const pw = zone as PowerZone;
    const pct = fromField === "max" ? pw.maxPercent : pw.minPercent;
    if (threshold) return Math.round((threshold * pct) / 100) + offset;
    return pct + offset;
  }
  const pace = zone as PaceZone;
  return (fromField === "max" ? pace.maxPace : pace.minPace) + offset;
}

function applyAdjacent(
  zone: ZoneRowData,
  toField: "min" | "max",
  value: number,
  type: string,
  threshold?: number
): ZoneRowData {
  if (type === "heartRate") {
    return { ...zone, [toField === "min" ? "minBpm" : "maxBpm"]: value };
  }
  if (type === "power") {
    const pct = threshold ? Math.round((value / threshold) * 100) : value;
    return { ...zone, [toField === "min" ? "minPercent" : "maxPercent"]: pct };
  }
  return { ...zone, [toField === "min" ? "minPace" : "maxPace"]: value };
}

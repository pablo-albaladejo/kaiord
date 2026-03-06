/**
 * Zone cascade logic
 *
 * Recursively adjusts subsequent zones to maintain contiguity
 * and the min < max invariant.
 */

import { getRealValue, setRealValue } from "./zone-field-access";
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
    setRealValue(zones, i + 1, "min", curMax + 1, type, threshold);
    const nextMin = getRealValue(zones[i + 1], "min", type, threshold);
    const nextMax = getRealValue(zones[i + 1], "max", type, threshold);
    if (nextMin <= nextMax) break;
    setRealValue(zones, i + 1, "max", nextMin + 1, type, threshold);
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
    setRealValue(zones, i - 1, "max", curMin - 1, type, threshold);
    const prevMax = getRealValue(zones[i - 1], "max", type, threshold);
    const prevMin = getRealValue(zones[i - 1], "min", type, threshold);
    if (prevMin <= prevMax) break;
    setRealValue(zones, i - 1, "min", prevMax - 1, type, threshold);
  }
}

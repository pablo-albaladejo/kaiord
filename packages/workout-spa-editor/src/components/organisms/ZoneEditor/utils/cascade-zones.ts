/**
 * Zone cascade logic
 *
 * Recursively adjusts zones to maintain contiguity
 * and the min <= max invariant within each zone.
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
  if (field === "max") {
    fixSameZone(result, index, "max", type, threshold);
    cascadeForward(result, index, type, threshold);
  }
  if (field === "min") {
    fixSameZone(result, index, "min", type, threshold);
    cascadeBackward(result, index, type, threshold);
    cascadeForward(result, index, type, threshold);
  }
  return result;
}

function fixSameZone(
  zones: Array<ZoneRowData>,
  idx: number,
  changed: "min" | "max",
  type: string,
  threshold?: number
): void {
  const min = getRealValue(zones[idx], "min", type, threshold);
  const max = getRealValue(zones[idx], "max", type, threshold);
  if (min > max) {
    if (changed === "min") {
      setRealValue(zones, idx, "max", min + 1, type, threshold);
    } else {
      setRealValue(zones, idx, "min", max - 1, type, threshold);
    }
  }
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
    const nMin = getRealValue(zones[i + 1], "min", type, threshold);
    const nMax = getRealValue(zones[i + 1], "max", type, threshold);
    if (nMin <= nMax) break;
    setRealValue(zones, i + 1, "max", nMin + 1, type, threshold);
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
    const pMax = getRealValue(zones[i - 1], "max", type, threshold);
    const pMin = getRealValue(zones[i - 1], "min", type, threshold);
    if (pMin <= pMax) break;
    setRealValue(zones, i - 1, "min", pMax - 1, type, threshold);
  }
}

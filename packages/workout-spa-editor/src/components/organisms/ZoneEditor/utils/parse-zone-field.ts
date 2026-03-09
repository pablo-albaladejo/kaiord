/**
 * Zone field parsing utilities
 *
 * Parses raw string input into zone field patches.
 * Cascades changes to adjacent zones for contiguity.
 */

import { cascadeToNeighbors } from "./cascade-zones";
import { mmSsToSeconds } from "./pace-format";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

type ZoneRowData = HeartRateZone | PowerZone | PaceZone;

export function applyValueChange(
  zones: Array<ZoneRowData>,
  index: number,
  field: "min" | "max",
  raw: string,
  type: string,
  threshold?: number
): Array<ZoneRowData> | null {
  const patch = parseField(field, raw, type, threshold);
  if (!patch) return null;
  const updated = zones.map((z, i) => (i === index ? { ...z, ...patch } : z));
  return cascadeToNeighbors(updated, index, field, type, threshold);
}

function parseField(
  field: "min" | "max",
  raw: string,
  type: string,
  threshold?: number
): Record<string, number> | null {
  if (type === "heartRate") return parseHrField(field, raw);
  if (type === "power") return parsePowerField(field, raw, threshold);
  return parsePaceField(field, raw);
}

function parseHrField(
  field: "min" | "max",
  raw: string
): Record<string, number> | null {
  const val = parseInt(raw, 10);
  if (isNaN(val)) return null;
  return field === "min" ? { minBpm: val } : { maxBpm: val };
}

function parsePowerField(
  field: "min" | "max",
  raw: string,
  threshold?: number
): Record<string, number> | null {
  const hasWattSuffix = /W\s*$/i.test(raw);
  const cleaned = raw.replace(/[W%]/g, "").trim();
  const val = parseInt(cleaned, 10);
  if (isNaN(val)) return null;
  if (hasWattSuffix && !threshold) return null;
  if (threshold) {
    const pct = (val / threshold) * 100;
    return field === "min" ? { minPercent: pct } : { maxPercent: pct };
  }
  return field === "min" ? { minPercent: val } : { maxPercent: val };
}

function parsePaceField(
  field: "min" | "max",
  raw: string
): Record<string, number> | null {
  const secs = mmSsToSeconds(raw);
  if (secs === undefined) return null;
  return field === "min" ? { minPace: secs } : { maxPace: secs };
}

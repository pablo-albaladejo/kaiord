/**
 * Zone value extraction and formatting
 *
 * Extracts display strings from zone objects by type.
 */

import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";
import type { ZoneRowData } from "../types/zone-table";
import { secondsToMmSs } from "./pace-format";

export function extractValues(
  zone: ZoneRowData,
  type: string,
  threshold?: number
): { minStr: string; maxStr: string } {
  if (type === "heartRate") {
    const hr = zone as HeartRateZone;
    return { minStr: String(hr.minBpm), maxStr: String(hr.maxBpm) };
  }
  if (type === "power") {
    const pw = zone as PowerZone;
    if (threshold) {
      const minW = Math.round((threshold * pw.minPercent) / 100);
      const maxW = Math.round((threshold * pw.maxPercent) / 100);
      return { minStr: `${minW}W`, maxStr: `${maxW}W` };
    }
    return { minStr: `${pw.minPercent}%`, maxStr: `${pw.maxPercent}%` };
  }
  const pace = zone as PaceZone;
  return {
    minStr: secondsToMmSs(pace.minPace),
    maxStr: secondsToMmSs(pace.maxPace),
  };
}

export function formatSecondary(
  zone: ZoneRowData,
  type: string,
  threshold?: number
): string | null {
  if (type === "power" && threshold) {
    const pw = zone as PowerZone;
    return `(${pw.minPercent}-${pw.maxPercent}%)`;
  }
  return null;
}

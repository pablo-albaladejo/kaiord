/**
 * Zones Format Helpers
 *
 * Helper functions for formatting zone data into text.
 */

import { secondsToMmSs } from "../ZoneEditor/utils/pace-format";
import type { SportZoneConfig } from "../../../types/sport-zones";

export function formatHrZones(
  config: SportZoneConfig,
  parts: Array<string>
): void {
  const hrZones = config.heartRateZones.zones
    .filter((z) => z.maxBpm > 0)
    .map((z) => `${z.name}: ${z.minBpm}-${z.maxBpm}bpm`)
    .join(", ");
  if (hrZones) parts.push(`HR zones: ${hrZones}`);
}

export function formatPowerZones(
  config: SportZoneConfig,
  ftp: number | undefined,
  parts: Array<string>
): void {
  if (!config.powerZones?.zones.length || !ftp) return;
  const zones = config.powerZones.zones
    .map(
      (z) =>
        `${z.name}: ${Math.round((ftp * z.minPercent) / 100)}-${Math.round((ftp * z.maxPercent) / 100)}W`
    )
    .join(", ");
  parts.push(`Power zones: ${zones}`);
}

export function formatPaceZones(
  config: SportZoneConfig,
  parts: Array<string>
): void {
  if (!config.paceZones?.zones.length) return;
  const zones = config.paceZones.zones
    .map(
      (z) =>
        `${z.name}: ${secondsToMmSs(z.minPace)}-${secondsToMmSs(z.maxPace)}${z.unit === "min_per_100m" ? "/100m" : "/km"}`
    )
    .join(", ");
  parts.push(`Pace zones: ${zones}`);
}

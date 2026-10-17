/**
 * Zones Format Helpers
 *
 * Helper functions for formatting zone data into text with real units.
 */

import type { ZoneMethod } from "../../../lib/zone-method-types";
import {
  HR_METHODS,
  PACE_METHODS,
  POWER_METHODS,
} from "../../../lib/zone-methods";
import type { SportZoneConfig } from "../../../types/sport-zones";
import { secondsToMmSs } from "../ZoneEditor/utils/pace-format";

function methodLabel(methods: Array<ZoneMethod>, id: string) {
  return methods.find((m) => m.id === id)?.name ?? id;
}

export function formatHrZones(
  config: SportZoneConfig,
  parts: Array<string>
): void {
  const hrZones = config.heartRateZones.zones
    .filter((z) => z.maxBpm > 0)
    .map((z) => `Z${z.zone} ${z.name}: ${z.minBpm}-${z.maxBpm}bpm`)
    .join(", ");
  if (!hrZones) return;
  const label = methodLabel(HR_METHODS, config.heartRateZones.method);
  parts.push(`HR zones (${label}): ${hrZones}`);
}

export function formatPowerZones(
  config: SportZoneConfig,
  ftp: number | undefined,
  parts: Array<string>
): void {
  if (!config.powerZones?.zones.length || !ftp) return;
  const label = methodLabel(POWER_METHODS, config.powerZones.method);
  const zones = config.powerZones.zones
    .map((z) => {
      const min = Math.round((ftp * z.minPercent) / 100);
      const max = Math.round((ftp * z.maxPercent) / 100);
      return `Z${z.zone} ${z.name}: ${min}-${max}W`;
    })
    .join(", ");
  parts.push(`Power zones (${label}, FTP: ${ftp}W): ${zones}`);
}

export function formatPaceZones(
  config: SportZoneConfig,
  parts: Array<string>
): void {
  if (!config.paceZones?.zones.length) return;
  const label = methodLabel(PACE_METHODS, config.paceZones.method);
  const zones = config.paceZones.zones
    .map((z) => {
      const unit = z.unit === "min_per_100m" ? "/100m" : "/km";
      return `Z${z.zone} ${z.name}: ${secondsToMmSs(z.minPace)}-${secondsToMmSs(z.maxPace)}${unit}`;
    })
    .join(", ");
  parts.push(`Pace zones (${label}): ${zones}`);
}

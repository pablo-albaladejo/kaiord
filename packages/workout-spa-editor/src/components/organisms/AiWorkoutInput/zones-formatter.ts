/**
 * Zones Formatter
 *
 * Formats training zone context for AI prompt injection.
 */

import {
  formatHrZones,
  formatPaceZones,
  formatPowerZones,
} from "./zones-format-helpers";
import { secondsToMmSs } from "../ZoneEditor/utils/pace-format";
import type { Profile } from "../../../types/profile";
import type { SportKey, SportZoneConfig } from "../../../types/sport-zones";

function formatSportZones(config: SportZoneConfig): string {
  const parts: Array<string> = [];
  const t = config.thresholds;

  if (t.lthr) parts.push(`LTHR: ${t.lthr}bpm`);
  if (t.ftp) parts.push(`FTP: ${t.ftp}W`);
  if (t.thresholdPace) {
    const unit = t.paceUnit === "min_per_100m" ? "/100m" : "/km";
    parts.push(`Threshold Pace: ${secondsToMmSs(t.thresholdPace)}${unit}`);
  }

  formatHrZones(config, parts);
  formatPowerZones(config, t.ftp, parts);
  formatPaceZones(config, parts);
  return parts.join("\n");
}

function formatLegacy(profile: Profile): string {
  const parts: Array<string> = [];
  if (profile.ftp) parts.push(`FTP: ${profile.ftp}W`);
  if (profile.maxHeartRate) {
    parts.push(`Max HR: ${profile.maxHeartRate}bpm`);
  }

  if (profile.powerZones?.length && profile.ftp) {
    const ftp = profile.ftp;
    const z = profile.powerZones
      .map(
        (p) =>
          `${p.name}: ${Math.round((ftp * p.minPercent) / 100)}-${Math.round((ftp * p.maxPercent) / 100)}W`
      )
      .join(", ");
    parts.push(`Power zones: ${z}`);
  }

  if (profile.heartRateZones?.length) {
    const z = profile.heartRateZones
      .filter((h) => h.maxBpm > 0)
      .map((h) => `${h.name}: ${h.minBpm}-${h.maxBpm}bpm`)
      .join(", ");
    if (z) parts.push(`HR zones: ${z}`);
  }
  return parts.join("\n");
}

export const formatZonesContext = (
  profile: Profile,
  sport?: SportKey
): string => {
  if (sport && profile.sportZones?.[sport]) {
    return formatSportZones(profile.sportZones[sport]);
  }

  if (profile.sportZones) {
    const allParts: Array<string> = [];
    for (const [key, config] of Object.entries(profile.sportZones)) {
      const formatted = formatSportZones(config);
      if (formatted) allParts.push(`[${key}] ${formatted}`);
    }
    if (allParts.length) return allParts.join("\n\n");
  }

  return formatLegacy(profile);
};

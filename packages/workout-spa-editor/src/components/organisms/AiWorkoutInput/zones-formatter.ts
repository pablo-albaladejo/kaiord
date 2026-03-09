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

export const formatZonesContext = (
  profile: Profile,
  sport?: SportKey
): string => {
  if (sport && profile.sportZones[sport]) {
    return formatSportZones(profile.sportZones[sport]);
  }

  const allParts: Array<string> = [];
  for (const [key, config] of Object.entries(profile.sportZones)) {
    const formatted = formatSportZones(config);
    if (formatted) allParts.push(`[${key}] ${formatted}`);
  }
  return allParts.length ? allParts.join("\n\n") : "";
};

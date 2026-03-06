/**
 * Zone indicator helper functions
 *
 * Formats threshold summaries for display.
 */

import { secondsToMmSs } from "../ZoneEditor/utils/pace-format";
import type { SportThresholds } from "../../../types/sport-zones";

export function formatThresholdSummary(thresholds: SportThresholds): string {
  const parts: Array<string> = [];

  if (thresholds.lthr) parts.push(`LTHR: ${thresholds.lthr}bpm`);
  if (thresholds.ftp) parts.push(`FTP: ${thresholds.ftp}W`);
  if (thresholds.thresholdPace) {
    const unit = thresholds.paceUnit === "min_per_100m" ? "/100m" : "/km";
    parts.push(`Pace: ${secondsToMmSs(thresholds.thresholdPace)}${unit}`);
  }

  return parts.join(", ");
}

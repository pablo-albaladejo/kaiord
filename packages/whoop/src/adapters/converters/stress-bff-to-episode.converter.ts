import type { StressEpisode } from "@kaiord/core";

import {
  extractStressPoints,
  type WhoopStressResponse,
} from "../schemas/whoop-stress.schema";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";
const MIN_LEVEL = 0;
const MAX_LEVEL = 100;
const PERCENT_SCALE = 100;

const clampRoundLevel = (fraction: number): number =>
  Math.min(
    MAX_LEVEL,
    Math.max(MIN_LEVEL, Math.round(fraction * PERCENT_SCALE))
  );

/**
 * Maps a WHOOP `health-service/v2/stress-bff/{date}` response to a single
 * KRD `stress` episode spanning the full day. `gauge.gauge_fill_percentage`
 * (0–1) is the day's averageLevel; the `stress_graph` timeline's maximum
 * `position_y` (also 0–1) is the peakLevel, floored at averageLevel so the
 * KRD refine (peakLevel >= averageLevel) always holds — whether every point
 * happens to fall below the gauge average or the graph is missing/garbled
 * and there are no points at all. Returns `null` when WHOOP reports no
 * gauge for the day (no stress data recorded).
 */
export const stressBffToEpisode = (
  bff: WhoopStressResponse,
  opts: { userId: number; date: string }
): StressEpisode | null => {
  const avgFraction = bff.gauge?.gauge_fill_percentage;
  if (avgFraction == null) return null;

  const averageLevel = clampRoundLevel(avgFraction);
  const points = extractStressPoints(bff);
  const peakFraction = points.length ? Math.max(...points) : avgFraction;
  const peakLevel = Math.max(clampRoundLevel(peakFraction), averageLevel);

  return {
    kind: "stress",
    version: KRD_VERSION,
    startTime: `${opts.date}T00:00:00.000Z`,
    endTime: `${opts.date}T23:59:59.999Z`,
    averageLevel,
    peakLevel,
    sourceBridgeId: SOURCE_BRIDGE_ID,
    externalId: `stress:${opts.userId}:${opts.date}`,
  };
};

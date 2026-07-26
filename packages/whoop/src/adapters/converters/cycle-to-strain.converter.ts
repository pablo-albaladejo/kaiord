import type { StrainSummary } from "@kaiord/core";

import type { WhoopCycleRecord } from "../schemas/whoop-cycles.schema";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

/**
 * Maps a WHOOP cycle to `extensions.health.strain`. Strain is a read-only,
 * source-agnostic cardiovascular-load summary — WHOOP's 0–21 `scaled_strain`
 * maps directly to `strainScore`, `day_kilojoules` to `energyKilojoules`, and
 * `day_avg_heart_rate`/`day_max_heart_rate` to `dayAverageHeartRate`/
 * `dayMaxHeartRate`. The KRD strain schema requires
 * `dayMaxHeartRate >= dayAverageHeartRate` when both are present; WHOOP's two
 * day-HR aggregates are computed independently and can occasionally invert,
 * so an inverted pair is dropped entirely rather than emitting a payload the
 * schema would reject. In-progress cycles (no `scaled_strain` yet) or cycles
 * whose `days` range has no parseable date yield `null` so the caller can
 * skip them.
 */
export const cycleToStrain = (
  record: WhoopCycleRecord
): StrainSummary | null => {
  const { cycle } = record;
  if (cycle.scaled_strain == null || cycle.days == null) {
    return null;
  }

  const dateMatch = DATE_PATTERN.exec(cycle.days);
  if (dateMatch === null) {
    return null;
  }

  const {
    day_avg_heart_rate: dayAverageHeartRate,
    day_max_heart_rate: dayMaxHeartRate,
  } = cycle;
  const dayHeartRatesInverted =
    dayAverageHeartRate != null &&
    dayMaxHeartRate != null &&
    dayMaxHeartRate < dayAverageHeartRate;

  return {
    kind: "strain",
    version: KRD_VERSION,
    date: dateMatch[0],
    strainScore: cycle.scaled_strain,
    ...(cycle.day_kilojoules != null
      ? { energyKilojoules: cycle.day_kilojoules }
      : {}),
    ...(dayAverageHeartRate != null && !dayHeartRatesInverted
      ? { dayAverageHeartRate }
      : {}),
    ...(dayMaxHeartRate != null && !dayHeartRatesInverted
      ? { dayMaxHeartRate }
      : {}),
    sourceBridgeId: SOURCE_BRIDGE_ID,
    externalId: `cycle:${cycle.id}:strain`,
  };
};

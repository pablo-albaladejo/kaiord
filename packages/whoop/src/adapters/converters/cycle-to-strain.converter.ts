import type { StrainSummary } from "@kaiord/core";

import type { WhoopCycleRecord } from "../schemas/whoop-cycles.schema";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

/**
 * Maps a WHOOP cycle to `extensions.health.strain`. Strain is a read-only,
 * source-agnostic cardiovascular-load summary — WHOOP's 0–21 `scaled_strain`
 * maps directly to `strainScore`. Day-level heart-rate aggregates are never
 * set: WHOOP's internal API only reliably reports HR aggregates per workout,
 * not per cycle, so `dayAverageHeartRate`/`dayMaxHeartRate` are left unset
 * here rather than guessed. In-progress cycles (no `scaled_strain` yet) or
 * cycles whose `days` range has no parseable date yield `null` so the caller
 * can skip them.
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

  return {
    kind: "strain",
    version: KRD_VERSION,
    date: dateMatch[0],
    strainScore: cycle.scaled_strain,
    ...(cycle.kilojoule !== undefined
      ? { energyKilojoules: cycle.kilojoule }
      : {}),
    sourceBridgeId: SOURCE_BRIDGE_ID,
    externalId: `cycle:${cycle.id}:strain`,
  };
};

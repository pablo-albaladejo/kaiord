/**
 * v8 → v9 migration helpers (zone-method-aware reconcile prep).
 *
 * Two row-level mutations applied to every existing profile (per design
 * D-MA7 of zones-method-aware-reconcile):
 *
 *   1. Normalize `method = "manual"` (introduced by sync-zones-band-writes
 *      in the prior train2go-zones-sync-full-bands change) → `"custom"`.
 *      The `"manual"` value didn't fit the existing convention.
 *   2. Reclassify `method = "custom"` AND zones-clearly-not-defaults →
 *      `method = "user"`. Conservative: only flip when content is clearly
 *      user-touched. False-negatives produce conflicts on next sync
 *      (handled gracefully by the new dialog); false-positives produce
 *      conflicts forever (avoided).
 *
 * `lastSyncedZonesSnapshot` stays absent for migrated profiles — next
 * sync establishes the baseline.
 */
import type { Transaction } from "dexie";

const SPORTS = ["cycling", "running", "swimming", "generic"] as const;
const ZONE_KINDS = ["heartRateZones", "powerZones", "paceZones"] as const;
type ZoneKind = (typeof ZONE_KINDS)[number];

const COGGAN_7_DEFAULTS = [
  { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Tempo", minPercent: 76, maxPercent: 90 },
  { zone: 4, name: "Lactate Threshold", minPercent: 91, maxPercent: 105 },
  { zone: 5, name: "VO2 Max", minPercent: 106, maxPercent: 120 },
  { zone: 6, name: "Anaerobic Capacity", minPercent: 121, maxPercent: 150 },
  { zone: 7, name: "Neuromuscular Power", minPercent: 151, maxPercent: 200 },
];

/**
 * `hasUserData(zones, kind)` — returns true when the zones array
 * CLEARLY differs from the canonical seed/default for its kind.
 * Conservative (false-negative biased per D-MA7).
 */
export const hasUserData = (
  zones: unknown[] | undefined,
  kind: ZoneKind
): boolean => {
  if (!Array.isArray(zones) || zones.length === 0) return false;
  if (kind === "heartRateZones") {
    if (zones.length !== 5) return true;
    return zones.some((z) => {
      const band = z as { minBpm?: number; maxBpm?: number };
      return (band.minBpm ?? 0) > 0 || (band.maxBpm ?? 0) > 0;
    });
  }
  if (kind === "paceZones") {
    if (zones.length !== 5) return true;
    return zones.some((z) => {
      const band = z as { minPace?: number; maxPace?: number };
      return (band.minPace ?? 0) > 0 || (band.maxPace ?? 0) > 0;
    });
  }
  // powerZones: compare first 5 entries against Coggan-7 defaults.
  if (zones.length < 5) return true;
  for (let i = 0; i < 5; i++) {
    const band = zones[i] as { minPercent?: number; maxPercent?: number };
    const def = COGGAN_7_DEFAULTS[i];
    if (
      !def ||
      (band.minPercent ?? -1) !== def.minPercent ||
      (band.maxPercent ?? -1) !== def.maxPercent
    ) {
      return true;
    }
  }
  return false;
};

export const reclassifyZoneMethods = (row: Record<string, unknown>): void => {
  const sportZones = row.sportZones as
    | Record<string, Record<string, unknown> | undefined>
    | undefined;
  if (!sportZones) return;
  for (const sport of SPORTS) {
    const cfg = sportZones[sport];
    if (!cfg) continue;
    for (const kind of ZONE_KINDS) {
      const zc = cfg[kind] as
        | { method?: string; zones?: unknown[] }
        | undefined;
      if (!zc) continue;
      if (zc.method === "manual") zc.method = "custom";
      if (zc.method === "custom" && hasUserData(zc.zones, kind)) {
        zc.method = "user";
      }
    }
  }
};

export const applyV9Upgrade = async (tx: Transaction): Promise<void> => {
  await tx.table("profiles").toCollection().modify(reclassifyZoneMethods);
};

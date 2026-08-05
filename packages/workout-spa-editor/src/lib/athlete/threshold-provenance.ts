import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type { ThresholdFieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";

type SnapshotScalarKey =
  | "bodyWeight"
  | "maxHeartRate"
  | "cyclingFtp"
  | "cyclingLthr"
  | "runningLthr"
  | "runningThresholdPace"
  | "swimmingCss";

/* Which scalar of a sync snapshot carries which threshold. A field missing
   from this table is never reported as synced, because no source writes it —
   swimming LTHR is the live example. */
export const SNAPSHOT_SCALAR: Partial<
  Record<ThresholdFieldKey, SnapshotScalarKey>
> = {
  bodyWeight: "bodyWeight",
  "heartRate.max": "maxHeartRate",
  "cycling.thresholds.ftp": "cyclingFtp",
  "cycling.thresholds.lthr": "cyclingLthr",
  "running.thresholds.lthr": "runningLthr",
  "running.thresholds.thresholdPaceSecPerKm": "runningThresholdPace",
  "swimming.thresholds.cssPaceSecPer100m": "swimmingCss",
};

export type ThresholdProvenance =
  | { kind: "synced"; source: string; at: string; stale: boolean }
  | { kind: "manual"; since: string; stale: boolean };

const MS_PER_DAY = 86_400_000;

/** A number nobody has confirmed in six months is asking to be looked at. */
export const STALE_AFTER_DAYS = 180;

const isOlderThanWindow = (iso: string, now: Date): boolean => {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return false;
  return now.getTime() - at > STALE_AFTER_DAYS * MS_PER_DAY;
};

const syncedSource = (
  profile: Profile,
  scalar: SnapshotScalarKey,
  value: number
): { source: string; at: string } | undefined => {
  for (const account of profile.linkedAccounts) {
    const snapshot: LastSyncedZonesSnapshot | undefined =
      account.lastSyncedZonesSnapshot;
    if (snapshot && snapshot[scalar] === value) {
      return { source: account.source, at: snapshot.syncedAt };
    }
  }
  return undefined;
};

/**
 * Where a threshold came from, derived rather than stored.
 *
 * A value that equals what a linked account last synced came from that
 * account, at the snapshot's `syncedAt`. Anything else was typed by hand.
 *
 * Nothing records WHEN a number was typed, so a manual provenance carries
 * `profile.updatedAt` as `since` — a bound, not a claim: no field can have
 * been typed after the profile was last written. Callers may state that date
 * only when it proves the value is old (`stale`); a recently written profile
 * proves nothing about any single field on it.
 */
export function deriveThresholdProvenance(
  profile: Profile,
  field: ThresholdFieldKey,
  value: number | undefined,
  now: Date
): ThresholdProvenance {
  const scalar = SNAPSHOT_SCALAR[field];
  const synced =
    scalar !== undefined && value !== undefined
      ? syncedSource(profile, scalar, value)
      : undefined;

  if (synced) {
    return {
      kind: "synced",
      ...synced,
      stale: isOlderThanWindow(synced.at, now),
    };
  }
  return {
    kind: "manual",
    since: profile.updatedAt,
    stale: isOlderThanWindow(profile.updatedAt, now),
  };
}

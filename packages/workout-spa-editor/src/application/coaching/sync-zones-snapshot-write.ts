/**
 * `updateSnapshot` — given a profile and a sport-kind that just had
 * its zones silent-replaced from T2G, return a new profile with the
 * linked-account's `lastSyncedZonesSnapshot` updated to reflect the
 * post-write zones (atomic with the zone write per D-MA2).
 */
import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type { Profile } from "../../types/profile";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

const KIND_TO_SNAPSHOT_KEY: Record<
  `${Sport}.${ZoneKind}`,
  keyof LastSyncedZonesSnapshot
> = {
  "cycling.heartRateZones": "cyclingHr",
  "running.heartRateZones": "runningHr",
  "swimming.heartRateZones": "swimmingHr",
  "cycling.powerZones": "cyclingPower",
  "running.paceZones": "runningPace",
  "swimming.paceZones": "swimmingPace",
  "cycling.paceZones": "runningPace",
  "running.powerZones": "cyclingPower",
  "swimming.powerZones": "cyclingPower",
};

const emptySnapshot = (now: string): LastSyncedZonesSnapshot =>
  ({
    syncedAt: now,
    cyclingHr: [],
    runningHr: [],
    swimmingHr: [],
    cyclingPower: [],
    runningPace: [],
    swimmingPace: [],
  }) as LastSyncedZonesSnapshot;

const readPersistedZones = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind
): unknown[] | undefined => {
  const cfg = profile.sportZones[sport];
  if (!cfg) return undefined;
  const zc = (cfg as Record<string, unknown>)[kind] as
    | { zones?: unknown[] }
    | undefined;
  return zc?.zones;
};

/**
 * Update `linkedAccounts[i].lastSyncedZonesSnapshot` with the persisted
 * zones for the given sport-kinds. `syncedAt` is bumped to `now`.
 */
export const updateSnapshot = (
  profile: Profile,
  source: string,
  sportKinds: Array<{ sport: Sport; kind: ZoneKind }>,
  now: string
): Profile => {
  if (sportKinds.length === 0) return profile;
  const idx = profile.linkedAccounts.findIndex((a) => a.source === source);
  if (idx === -1) return profile;
  const account = profile.linkedAccounts[idx];
  if (!account) return profile;
  const base = account.lastSyncedZonesSnapshot ?? emptySnapshot(now);
  const next: LastSyncedZonesSnapshot = { ...base, syncedAt: now };
  for (const { sport, kind } of sportKinds) {
    const zones = readPersistedZones(profile, sport, kind);
    if (!zones) continue;
    const key = KIND_TO_SNAPSHOT_KEY[`${sport}.${kind}`];
    (next as Record<string, unknown>)[key] = zones;
  }
  const linkedAccounts = profile.linkedAccounts.map((a, i) =>
    i === idx ? { ...a, lastSyncedZonesSnapshot: next } : a
  );
  return { ...profile, linkedAccounts };
};

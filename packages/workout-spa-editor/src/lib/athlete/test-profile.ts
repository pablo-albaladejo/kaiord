import type {
  LastSyncedZonesSnapshot,
  LinkedCoachingAccount,
} from "../../types/coaching-account";
import type { Profile } from "../../types/profile";
import type { SportThresholds, SportZoneConfig } from "../../types/sport-zones";
import type { ActiveSport } from "./sports";

type SnapshotScalars = Omit<
  LastSyncedZonesSnapshot,
  | "syncedAt"
  | "cyclingHr"
  | "runningHr"
  | "swimmingHr"
  | "cyclingPower"
  | "runningPace"
  | "swimmingPace"
>;

/** A linked account whose last sync recorded the given threshold scalars.
    The band arrays are empty: provenance reads only the scalars. */
export function syncedAccount(
  source: string,
  syncedAt: string,
  scalars: SnapshotScalars
): LinkedCoachingAccount {
  return {
    source,
    externalUserId: "1",
    externalUserName: "tester",
    linkedAt: "2024-01-01T00:00:00.000Z",
    lastSyncedZonesSnapshot: {
      syncedAt,
      cyclingHr: [],
      runningHr: [],
      swimmingHr: [],
      cyclingPower: [],
      runningPace: [],
      swimmingPace: [],
      ...scalars,
    },
  };
}

/** Builds a minimal valid Profile with one sport's thresholds set, for unit
    tests of the Athlete derivation helpers. `overrides` lets a case attach
    linked accounts or move `updatedAt` — both of which the threshold
    provenance derivation reads. */
export function profileWith(
  sport: ActiveSport,
  thresholds: SportThresholds,
  maxHeartRate?: number,
  overrides: Partial<Profile> = {}
): Profile {
  const config: SportZoneConfig = {
    thresholds,
    heartRateZones: { method: "karvonen-5", zones: [] },
  };
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Test Athlete",
    maxHeartRate,
    sportZones: { [sport]: config },
    linkedAccounts: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

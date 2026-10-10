/**
 * Per-table rules for moving the default (auto) profile's rows onto another
 * profile. `key` names the fields whose value must stay unique once
 * `profileId` is rewritten (the primary key, or a unique natural key); it
 * defaults to `id`. On a collision with a row the target already owns:
 *   - `target`: the target's row wins;
 *   - `lww`: the newer `updatedAt`/`createdAt` wins, and the target wins
 *     when either row has no clock or the clocks tie;
 *   - `drop`: the auto profile's rows are discarded outright (integration
 *     cursors: re-syncing them is harmless).
 * A coverage test in the Dexie adapter fails when a per-profile or
 * device-local table has no entry here.
 */

export type RekeyCollision = "target" | "lww" | "drop";

export type RekeyRule = {
  key?: ReadonlyArray<string>;
  onCollision: RekeyCollision;
};

const BY_ID: RekeyRule = { onCollision: "lww" };

export const AUTO_PROFILE_REKEY_RULES: Readonly<Record<string, RekeyRule>> = {
  workouts: BY_ID,
  plannedSessions: BY_ID,
  activities: BY_ID,
  coachingActivities: BY_ID,
  coachingDayNotes: BY_ID,
  sessionMatches: BY_ID,
  chatConversations: BY_ID,
  chatMessages: BY_ID,
  labReports: BY_ID,
  labValues: BY_ID,
  healthSleep: BY_ID,
  healthWeight: BY_ID,
  healthHrv: BY_ID,
  healthDaily: BY_ID,
  healthBodyComposition: BY_ID,
  healthStress: BY_ID,
  healthStrain: BY_ID,
  healthVitals: BY_ID,
  healthHeartRateSeries: BY_ID,
  intakeEntries: BY_ID,
  intakePresets: BY_ID,
  userPreferences: { key: ["profileId"], onCollision: "lww" },
  energyTargets: { key: ["profileId"], onCollision: "lww" },
  aiModelBindings: { key: ["profileId", "purpose"], onCollision: "target" },
  dataTypeSourcePolicy: {
    key: ["profileId", "dataType"],
    onCollision: "target",
  },
  autoMatchDismissals: {
    key: ["profileId", "weekStart"],
    onCollision: "target",
  },
  integrationPolicies: {
    key: ["profileId", "dataType", "direction", "bridgeId"],
    onCollision: "target",
  },
  connections: { key: ["profileId", "providerId"], onCollision: "target" },
  coachingSyncState: { onCollision: "drop" },
};

/** Device-local tables: re-keyed in place, never part of the snapshot. */
export const DEVICE_LOCAL_REKEY_TABLES: ReadonlyArray<string> = [
  "connections",
  "intakeEntries",
  "intakePresets",
  "energyTargets",
];

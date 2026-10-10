/**
 * Per-table rules for moving the default (auto) profile's rows onto another
 * profile. `key` names the fields whose value must stay unique once
 * `profileId` is rewritten (the primary key, or a unique natural key); it
 * defaults to `id`. `uniqueKeys` adds natural keys that must stay unique
 * too, such as an import's provenance; a key whose fields are not all
 * present on a row is skipped for that row, which then falls back to `key`.
 * On a collision with a row the target already owns:
 *   - `target`: the target's row wins;
 *   - `lww`: the newer `updatedAt`/`createdAt` wins, and the target wins
 *     when either row has no clock or the clocks tie;
 *   - `drop`: the auto profile's rows are discarded outright (integration
 *     cursors: re-syncing them is harmless).
 * A winning auto row keeps the target row's `key` fields, so the row the
 * remote already holds is updated rather than duplicated. An auto row that
 * collides with two different target rows loses to both.
 * A coverage test in the Dexie adapter fails when a per-profile or
 * device-local table has no entry here.
 */

export type RekeyCollision = "target" | "lww" | "drop";

export type RekeyRule = {
  key?: ReadonlyArray<string>;
  uniqueKeys?: ReadonlyArray<ReadonlyArray<string>>;
  onCollision: RekeyCollision;
};

const BY_ID: RekeyRule = { onCollision: "lww" };

/** Imported records: random ids, unique by their source's record id. */
const BY_PROVENANCE: RekeyRule = {
  uniqueKeys: [["profileId", "sourceBridgeId", "externalId"]],
  onCollision: "lww",
};

export const AUTO_PROFILE_REKEY_RULES: Readonly<Record<string, RekeyRule>> = {
  workouts: BY_ID,
  plannedSessions: BY_ID,
  activities: BY_PROVENANCE,
  coachingActivities: BY_ID,
  coachingDayNotes: BY_ID,
  // One match per planned activity and per workout within a profile; the
  // target's existing match is never overwritten (spa-session-match).
  sessionMatches: {
    uniqueKeys: [
      ["profileId", "coachingActivityId"],
      ["profileId", "workoutId"],
    ],
    onCollision: "target",
  },
  chatConversations: BY_ID,
  chatMessages: BY_ID,
  labReports: BY_ID,
  labValues: BY_ID,
  healthSleep: BY_PROVENANCE,
  healthWeight: BY_PROVENANCE,
  healthHrv: BY_PROVENANCE,
  healthDaily: BY_PROVENANCE,
  healthBodyComposition: BY_PROVENANCE,
  healthStress: BY_PROVENANCE,
  healthStrain: BY_PROVENANCE,
  healthVitals: BY_PROVENANCE,
  healthHeartRateSeries: BY_PROVENANCE,
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

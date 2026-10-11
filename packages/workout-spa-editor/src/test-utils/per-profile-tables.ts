/**
 * The per-profile tables of the live schema, written out by hand. Tests
 * compare the adapter's own classification and the re-key rule table
 * against this list, so neither can vouch for itself: a new per-profile
 * table fails them until it is added here and given a re-key rule.
 */

export const PER_PROFILE_TABLES: ReadonlyArray<string> = [
  "activities",
  "aiModelBindings",
  "autoMatchDismissals",
  "chatConversations",
  "chatMessages",
  "coachingActivities",
  "coachingDayNotes",
  "coachingSyncState",
  "connections",
  "dataTypeSourcePolicy",
  "energyTargets",
  "healthBodyComposition",
  "healthDaily",
  "healthHeartRateSeries",
  "healthHrv",
  "healthSleep",
  "healthStrain",
  "healthStress",
  "healthVitals",
  "healthWeight",
  "intakeEntries",
  "intakePresets",
  "integrationPolicies",
  "labReports",
  "labValues",
  "plannedSessions",
  "sessionMatches",
  "userPreferences",
  "workouts",
];

/** Per-profile tables that never travel in the snapshot. */
export const DEVICE_LOCAL_TABLES: ReadonlyArray<string> = [
  "connections",
  "energyTargets",
  "intakeEntries",
  "intakePresets",
];

/** Imported-record tables, unique by `[profileId+sourceBridgeId+externalId]`. */
export const PROVENANCE_TABLES: ReadonlyArray<string> = [
  "activities",
  "healthBodyComposition",
  "healthDaily",
  "healthHeartRateSeries",
  "healthHrv",
  "healthSleep",
  "healthStrain",
  "healthStress",
  "healthVitals",
  "healthWeight",
];

/**
 * Which Dexie tables a backup file carries, and how. Every table of the live
 * schema is classified here; the adapter-side coverage test fails on a table
 * that is not, and `applyBackupTablePolicy` drops an unclassified table, so a
 * new store never reaches a file before someone decides it should.
 *
 * - `include`: the snapshot rows, as they are.
 * - `exclude`: never in the file (secrets, integration cursors, device state).
 * - `repository`: read through its repository, outside the snapshot tables.
 * - a function: the snapshot rows, rewritten row by row.
 */

import type { SnapshotTables } from "../../types/snapshot";
import { isAutoProfile } from "../profile/helpers/claim-profile";

type Row = Record<string, unknown>;

export type BackupTableRule =
  "include" | "exclude" | "repository" | ((row: Row) => Row);

// The key is encrypted with a passphrase shipped in the bundle, so a file
// holding it would hold the key. The rest of the provider config is kept.
const withoutApiKey = (row: Row): Row =>
  Object.fromEntries(Object.entries(row).filter(([key]) => key !== "apiKey"));

// The file is read on another device, where the profile must arrive as a real
// one. Only the file says so: the local profile stays unclaimed and inert.
const asRealProfile = (row: Row): Row =>
  isAutoProfile(row) ? { ...row, origin: "local" } : row;

export const BACKUP_TABLE_POLICY: Readonly<Record<string, BackupTableRule>> = {
  activities: "include",
  aiModelBindings: "include",
  aiProviders: withoutApiKey,
  autoMatchDismissals: "include",
  bridges: "exclude", // legacy, write-dead extension state of this device
  chatConversations: "include",
  chatMessages: "include",
  coachingActivities: "include",
  coachingDayNotes: "include",
  coachingSyncState: "exclude", // integration cursor: restoring it skips syncs
  connections: "exclude", // bridge linkage and credentials of this device
  dataTypeSourcePolicy: "include",
  energyTargets: "repository",
  exportLedger: "include",
  healthBodyComposition: "include",
  healthDaily: "include",
  healthHeartRateSeries: "include",
  healthHrv: "include",
  healthSleep: "include",
  healthStrain: "include",
  healthStress: "include",
  healthVitals: "include",
  healthWeight: "include",
  intakeEntries: "repository",
  intakePresets: "repository",
  integrationPolicies: "include",
  labReports: "include",
  labValues: "include",
  meta: "include",
  plannedSessions: "include",
  profiles: asRealProfile,
  sessionMatches: "include",
  syncState: "exclude", // integration cursor: restoring it skips syncs
  templates: "include",
  tombstones: "exclude", // they travel in the file's own `tombstones` field
  usageEvents: "include",
  userPreferences: "include",
  workouts: "include",
};

/** The snapshot tables a backup file carries, rewritten where the policy says. */
export const applyBackupTablePolicy = (
  tables: SnapshotTables
): SnapshotTables =>
  Object.fromEntries(
    Object.entries(tables).flatMap(([name, rows]) => {
      const rule = BACKUP_TABLE_POLICY[name];
      if (rule === "include") return [[name, rows]];
      if (typeof rule !== "function") return [];
      return [[name, rows.map((row) => rule(row as Row))]];
    })
  );

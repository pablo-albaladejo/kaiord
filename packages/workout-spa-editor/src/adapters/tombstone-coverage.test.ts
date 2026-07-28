/**
 * Coverage guard for delete-propagation: every id-deletable repository on
 * `PersistencePort` must be decorated by `withTombstones`, device-local, or
 * on an explicitly reasoned exception list. Adding a repo without
 * classifying it fails here.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { KaiordDatabase } from "./dexie/dexie-database";
import { DEVICE_LOCAL } from "./dexie/dexie-snapshot-port";
import { TOMBSTONED_TABLES } from "./with-tombstones";

/** Single-argument, primary-key-shaped delete methods. */
const ID_DELETE_METHODS = ["delete", "deleteById", "deleteReport"] as const;

const isIdDeletable = (repo: unknown): boolean =>
  typeof repo === "object" &&
  repo !== null &&
  ID_DELETE_METHODS.some((name) => {
    const method = (repo as Record<string, unknown>)[name];
    return typeof method === "function" && method.length === 1;
  });

/**
 * Every id-deletable repo on the port → the snapshot table its rows live in.
 * The port key and the table name differ often enough (`coaching`,
 * `sessionMatch`, `integrationPolicy`, `labs`) that the mapping has to be
 * written down: a tombstone filed under the port key would match no row,
 * because `mergeSnapshots` suppresses by `[snapshotTable+id]`.
 */
const SNAPSHOT_TABLE_BY_REPO: Record<string, string> = {
  workouts: "workouts",
  templates: "templates",
  profiles: "profiles",
  aiProviders: "aiProviders",
  usageEvents: "usageEvents",
  coaching: "coachingActivities",
  sessionMatch: "sessionMatches",
  chatConversations: "chatConversations",
  integrationPolicy: "integrationPolicies",
  labs: "labReports",
  syncState: "syncState",
  userPreferences: "userPreferences",
  intakeEntries: "intakeEntries",
  intakePresets: "intakePresets",
};

/**
 * Snapshot-riding repos the decorator deliberately does not cover. Each entry
 * states WHY; "we forgot" is not one of the reasons available.
 */
const REVIEWED_EXCEPTIONS: Record<string, string> = {
  // Hand-tombstoned in `deleteConversation` (messages + the conversation row):
  // the decorator cannot express a delete that spans two tables.
  chatConversations: "hand-tombstoned by deleteConversation",
  // Hand-tombstoned in `deleteLabReport`: the repo deletes via
  // `deleteReport` + `deleteValuesByReport`, neither a single `delete(id)`.
  labs: "hand-tombstoned by deleteLabReport",
  // Hand-tombstoned in `deleteIntegrationPolicy`: the repo's delete is
  // `deleteById`, outside the decorator's `delete(id)` shape.
  integrationPolicy: "hand-tombstoned by deleteIntegrationPolicy",
  // Structurally untombstonable: PK is `source`, not `id`. Tombstones are
  // `[table+id]` and the merge only suppresses rows whose `row.id` is a
  // string. Fixing it needs a tombstone-schema + merge change.
  syncState: "non-`id` primary key (source)",
  // Structurally untombstonable: PK is `profileId`, not `id`. Also purely
  // profile-scoped, so it travels with the profile-delete cascade.
  userPreferences: "non-`id` primary key (profileId)",
};

/**
 * Snapshot-riding Dexie tables reachable ONLY through repositories that are
 * not on `PersistencePort`, so the port sweep above cannot see them. Each
 * needs the same user-intent-vs-mirror verdict, recorded here.
 */
const OFF_PORT_TABLES: Record<string, string> = {
  // `exportLedger` (Dexie v17) is written by `createDexieExportLedgerRepository`,
  // never exposed on the port. THREE delete sites, all cascade/repair and none
  // user intent: the failed-POST rollback in `record-export-post.ts`, the Dexie
  // `deleting` hook in `dexie-export-ledger-cascade.ts` (source record removed),
  // and `sweepOrphanLedgerEntries` (disaster-recovery orphan scan). A
  // user-facing "forget this export" would have to tombstone.
  exportLedger: "off-port repo; rollback + cascade hook + orphan sweep only",
  // Key/value app metadata (active profile id, one-shot cleanup flags, the AI
  // custom prompt). Merged whole-record by manifest clock via
  // TIMESTAMPLESS_TABLES; keyed on `key`, so it is untombstonable anyway.
  meta: "timestampless key/value store, merged by manifest",
  // v27 Data Hub stores. No single-row delete surface; the profile cascade
  // clears them via `PROFILE_DATE_TABLES` in the health-cleanup repository.
  plannedSessions: "cascade-only delete (PROFILE_DATE_TABLES)",
  activities: "cascade-only delete (PROFILE_DATE_TABLES)",
  // Ingest-only mirrors of upstream provider data. No single-row delete
  // surface — F2 removed the unused `HealthRecordRepository.delete(id)` — and
  // the profile cascade clears them via `PROFILE_ID_TABLES`. A re-ingest
  // reconciliation must NOT tombstone (see the user-intent rule); a
  // user-facing "delete this measurement" would have to.
  healthSleep: "cascade-only delete (PROFILE_ID_TABLES)",
  healthWeight: "cascade-only delete (PROFILE_ID_TABLES)",
  healthHrv: "cascade-only delete (PROFILE_ID_TABLES)",
  healthDaily: "cascade-only delete (PROFILE_ID_TABLES)",
  healthBodyComposition: "cascade-only delete (PROFILE_ID_TABLES)",
  healthStress: "cascade-only delete (PROFILE_ID_TABLES)",
  healthStrain: "cascade-only delete (PROFILE_ID_TABLES)",
  healthVitals: "cascade-only delete (PROFILE_ID_TABLES)",
  healthHeartRateSeries: "cascade-only delete (PROFILE_ID_TABLES)",
  // Plain `id` PKs — tombstonable if a single-row delete is ever added.
  // `labValues` already IS hand-tombstoned, per value, by `deleteLabReport`.
  labValues: "hand-tombstoned by deleteLabReport; cascade otherwise",
  chatMessages: "hand-tombstoned by deleteConversation; cascade otherwise",
  coachingDayNotes: "cascade-only delete; plain `id` PK, so tombstonable",
  // Composite PKs — structurally untombstonable under `[table+id]`.
  // aiModelBindings is NOT cascade-only: `clearModelBinding` deletes one row
  // on user action ("revert this purpose to the default model", wired from
  // SettingsPanel). That delete resurrects at the user's own next sync — it
  // sits on the composite-PK gap documented in design.md, tracked not fixed.
  aiModelBindings:
    "composite PK (untombstonable — see design.md gap); user delete via " +
    "clearModelBinding resurrects, tracked not fixed here",
  autoMatchDismissals: "composite PK; cascade-only delete",
  coachingSyncState: "composite PK; cascade-only delete",
  dataTypeSourcePolicy: "composite PK; cascade-only delete",
  // Legacy and write-dead: the only writer left is the v6 migration backfill
  // (`register-kaiord-versions.ts`). Despite holding device-scoped extension
  // state it is NOT in DEVICE_LOCAL, so it rides the snapshot — harmless only
  // because the table is empty in practice.
  bridges: "legacy, write-dead; rides the snapshot though device-scoped",
};

const idDeletableRepos = (): string[] =>
  Object.entries(createInMemoryPersistence())
    .filter(([, repo]) => isIdDeletable(repo))
    .map(([key]) => key)
    .sort();

describe("tombstone coverage", () => {
  it("should classify exactly the id-deletable repositories on the port", () => {
    // Arrange
    // equality both ways: a new deletable repo fails as unclassified,
    // and a removed one fails as a stale entry, so the table cannot rot into a
    // vacuous pass.
    const classified = Object.keys(SNAPSHOT_TABLE_BY_REPO).sort();

    // Act
    const repos = idDeletableRepos();

    // Assert
    expect(repos).toEqual(classified);
  });

  it("should decorate or explicitly excuse every snapshot-riding deletable repo", () => {
    // Arrange
    const decorated = new Set(Object.keys(TOMBSTONED_TABLES));

    // Act
    const uncovered = idDeletableRepos()
      .filter((key) => !DEVICE_LOCAL.has(SNAPSHOT_TABLE_BY_REPO[key]))
      .filter((key) => !decorated.has(key))
      .filter((key) => REVIEWED_EXCEPTIONS[key] === undefined);

    // Assert
    expect(uncovered).toEqual([]);
  });

  it("should not excuse a repo that is already decorated", () => {
    // Arrange
    const decorated = Object.keys(TOMBSTONED_TABLES);

    // Act
    const contradictory = decorated.filter(
      (key) => REVIEWED_EXCEPTIONS[key] !== undefined
    );

    // Assert
    expect(contradictory).toEqual([]);
  });

  it("should map each decorated repo to its declared snapshot table", () => {
    // Arrange
    const entries = Object.entries(TOMBSTONED_TABLES);

    // Act
    const mismatched = entries.filter(
      ([key, table]) => SNAPSHOT_TABLE_BY_REPO[key] !== table
    );

    // Assert
    expect(mismatched).toEqual([]);
  });
});

describe("tombstone table names", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = `kaiord-test-tombcover-${Date.now()}-${Math.random()}`;
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should file every tombstone under a real snapshot table name", () => {
    // Arrange
    // a tombstone whose `table` is not an actual table name can
    // never suppress anything: the merge looks rows up by `[table+id]`.
    const tableNames = new Set(db.tables.map((t) => t.name));

    // Act
    const unknown = Object.values(TOMBSTONED_TABLES).filter(
      (table) => !tableNames.has(table)
    );

    // Assert
    expect(unknown).toEqual([]);
  });

  it("should not excuse a table that does not exist", () => {
    // Arrange
    // without this, `OFF_PORT_TABLES` is only ever read as a filter,
    // so a typo'd or stale key rots silently. Worse, an entry can PRE-EXCUSE a
    // table that does not exist yet: `plannedSessions` was in exactly that
    // position before v27, and would have been waved through on arrival.
    const tableNames = new Set(db.tables.map((t) => t.name));

    // Act
    const phantom = Object.keys(OFF_PORT_TABLES)
      .filter((table) => !tableNames.has(table))
      .sort();

    // Assert
    expect(phantom).toEqual([]);
  });

  it("should account for every synced table, including off-port ones", () => {
    // Arrange
    // the port sweep is blind to repositories that are not on
    // `PersistencePort` (`exportLedger` is the live example). Sweeping the
    // real schema instead is what makes this guard a backstop rather than a
    // restatement of the port's shape.
    const covered = new Set([
      ...Object.values(SNAPSHOT_TABLE_BY_REPO),
      ...Object.keys(OFF_PORT_TABLES),
    ]);

    // Act
    const unaccounted = db.tables
      .map((t) => t.name)
      .filter((name) => !DEVICE_LOCAL.has(name))
      .filter((name) => !covered.has(name))
      .sort();

    // Assert
    expect(unaccounted).toEqual([]);
  });
});

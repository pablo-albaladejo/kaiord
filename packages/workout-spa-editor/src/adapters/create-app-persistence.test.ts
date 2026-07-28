/**
 * The join nobody was testing.
 *
 * Both halves of delete-propagation had unit suites — `withTombstones` records
 * markers, `mergeSnapshots` honours them — and the wiring between them was
 * still broken, because `main.tsx` handed the app a bare
 * `createDexiePersistence()`. These are application-level round trips composed
 * exactly the way production composes persistence (`createAppPersistence`),
 * against real Dexie (fake-indexeddb) and a shared fake cloud, so the
 * decorator/merge join is asserted as behaviour rather than as source text.
 */
import "fake-indexeddb/auto";

import type { LabReport, LabValue } from "@kaiord/core";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { deleteIntegrationPolicy } from "../application/integration-policy/delete-integration-policy.use-case";
import { deleteLabReport } from "../application/lab/delete-lab-report.use-case";
import { deleteProfile } from "../application/profile/delete-profile";
import { syncWithCloud } from "../application/sync/sync-with-cloud";
import { unmatchSession } from "../application/unmatch-session";
import type { CloudSyncPort } from "../ports/cloud-sync-port";
import type { PersistencePort } from "../ports/persistence-port";
import { createInMemoryCloudSyncPort } from "../test-utils/in-memory-cloud-sync-port";
import type { Snapshot } from "../types/snapshot";
import { createAppPersistence } from "./create-app-persistence";
import { KaiordDatabase } from "./dexie/dexie-database";
import { createDexieSnapshotPort } from "./dexie/dexie-snapshot-port";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const SEEDED_AT = "2026-05-20T00:00:00.000Z";

type Device = {
  db: KaiordDatabase;
  port: PersistencePort;
  sync: () => Promise<void>;
};

const dbName = (suffix: string) =>
  `kaiord-test-approundtrip-${suffix}-${Date.now()}-${Math.random()}`;

const openDevice = async (
  name: string,
  cloud: CloudSyncPort,
  deviceId: string
): Promise<Device> => {
  const db = new KaiordDatabase(name);
  await db.open();
  const snapshotPort = createDexieSnapshotPort(db);
  return {
    db,
    port: createAppPersistence(db),
    sync: async () => {
      await syncWithCloud({ cloud, snapshotPort, deviceId, maxRetries: 0 });
    },
  };
};

const rowsOf = (db: KaiordDatabase, table: string, id: string) =>
  db.table(table).get(id);

/** One user-delete class: how to create the row, and how the user removes it. */
type DeleteCase = {
  label: string;
  /** Snapshot/Dexie table name the tombstone must be filed under. */
  table: string;
  id: string;
  seed: (port: PersistencePort) => Promise<void>;
  remove: (port: PersistencePort) => Promise<void>;
};

const labReport = (id: string): LabReport => ({
  id,
  profileId: PROFILE_ID,
  date: "2026-03-05",
  provenance: { source: "manual" },
});

const labValue = (id: string, reportId: string): LabValue => ({
  id,
  profileId: PROFILE_ID,
  reportId,
  parameterKey: "glucose",
  date: "2026-03-05",
  valueRaw: 90,
  unitRaw: "mg/dL",
  valueCanonical: 90,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
});

const WORKOUT_CASE: DeleteCase = {
  label: "workout",
  table: "workouts",
  id: "w-1",
  seed: (port) =>
    port.workouts.put({
      id: "w-1",
      profileId: PROFILE_ID,
      date: "2026-05-20",
      state: "planned",
      updatedAt: SEEDED_AT,
    } as never),
  remove: (port) => port.workouts.delete("w-1"),
};

const DELETE_CASES: DeleteCase[] = [
  {
    label: "template",
    table: "templates",
    id: "t-1",
    seed: (port) =>
      port.templates.put({
        id: "t-1",
        sport: "cycling",
        name: "Sweet spot",
        krd: { version: "2.0", extensions: {} },
        updatedAt: SEEDED_AT,
      } as never),
    remove: (port) => port.templates.delete("t-1"),
  },
  {
    label: "profile",
    table: "profiles",
    id: PROFILE_ID,
    seed: (port) =>
      port.profiles.put({
        id: PROFILE_ID,
        name: "Pablo",
        linkedAccounts: [],
        sportZones: {},
        updatedAt: SEEDED_AT,
      } as never),
    remove: (port) => deleteProfile(port, PROFILE_ID),
  },
  {
    label: "AI provider",
    table: "aiProviders",
    id: "ai-1",
    seed: (port) =>
      port.aiProviders.put({
        id: "ai-1",
        provider: "anthropic",
        apiKey: "k",
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      } as never),
    remove: (port) => port.aiProviders.delete("ai-1"),
  },
  {
    label: "unmatched session",
    table: "sessionMatches",
    id: "m-1",
    seed: (port) =>
      port.sessionMatch.put({
        id: "m-1",
        profileId: PROFILE_ID,
        coachingActivityId: `${PROFILE_ID}:train2go:a-1`,
        workoutId: "w-1",
        date: "2026-05-20",
        createdAt: SEEDED_AT,
        source: "manual",
        executedWorkoutIds: [],
      }),
    remove: (port) =>
      unmatchSession(
        { profileId: PROFILE_ID, matchId: "m-1" },
        { repository: port.sessionMatch }
      ),
  },
  {
    label: "lab report",
    table: "labReports",
    id: "r-1",
    seed: async (port) => {
      await port.labs.putReport(labReport("r-1"));
      await port.labs.putValues([labValue("v-1", "r-1")]);
    },
    remove: (port) => deleteLabReport(port, "r-1"),
  },
  {
    label: "data-hub route",
    table: "integrationPolicies",
    id: "22222222-2222-4222-8222-222222222222",
    seed: (port) =>
      port.integrationPolicy.put({
        id: "22222222-2222-4222-8222-222222222222",
        profileId: PROFILE_ID,
        dataType: "workout",
        bridgeId: "garmin-bridge",
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: SEEDED_AT,
      }),
    remove: (port) =>
      deleteIntegrationPolicy(
        {
          policyRepo: port.integrationPolicy,
          tombstones: port.tombstones,
          transaction: port.transaction,
        },
        { id: "22222222-2222-4222-8222-222222222222" }
      ),
  },
];

const hasTombstone = (
  snapshot: Snapshot | null,
  table: string,
  id: string
): boolean =>
  (snapshot?.tombstones ?? []).some((t) => t.table === table && t.id === id);

describe("createAppPersistence cross-device delete round trip", () => {
  let nameA: string;
  let nameB: string;
  let deviceA: Device;
  let deviceB: Device;
  let cloud: ReturnType<typeof createInMemoryCloudSyncPort>;

  beforeEach(async () => {
    nameA = dbName("a");
    nameB = dbName("b");
    cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    deviceA = await openDevice(nameA, cloud, "device-a");
    deviceB = await openDevice(nameB, cloud, "device-b");
  });

  afterEach(async () => {
    deviceA.db.close();
    deviceB.db.close();
    await Dexie.delete(nameA);
    await Dexie.delete(nameB);
  });

  it("should keep a deleted workout deleted on the deleting device and on the other one", async () => {
    // Arrange — A creates a workout, both devices converge on it.
    await WORKOUT_CASE.seed(deviceA.port);
    await deviceA.sync();
    await deviceB.sync();
    expect(await rowsOf(deviceB.db, "workouts", "w-1")).toBeDefined();

    // Act — A deletes through the app port, then both devices sync again.
    await WORKOUT_CASE.remove(deviceA.port);
    await deviceA.sync();
    await deviceB.sync();

    // Assert — on today's unfixed code this fails on device A, which is the
    // sharpest form of the bug: the row the user just deleted is restored by
    // their OWN next sync, because the merge unions local+remote and no
    // tombstone was ever written to suppress the remote copy.
    expect(await rowsOf(deviceA.db, "workouts", "w-1")).toBeUndefined();
    expect(await rowsOf(deviceB.db, "workouts", "w-1")).toBeUndefined();
    expect(hasTombstone(cloud.state.snapshot, "workouts", "w-1")).toBe(true);
  });

  it.each(DELETE_CASES)(
    "should propagate a $label delete to both devices",
    async ({ table, id, seed, remove }) => {
      // Arrange
      await seed(deviceA.port);
      await deviceA.sync();
      await deviceB.sync();
      expect(await rowsOf(deviceB.db, table, id)).toBeDefined();

      // Act
      await remove(deviceA.port);
      await deviceA.sync();
      await deviceB.sync();

      // Assert
      expect(await rowsOf(deviceA.db, table, id)).toBeUndefined();
      expect(await rowsOf(deviceB.db, table, id)).toBeUndefined();
      expect(hasTombstone(cloud.state.snapshot, table, id)).toBe(true);
    }
  );

  it("should propagate the lab VALUES of a deleted report, not just the report row", async () => {
    // Arrange
    await deviceA.port.labs.putReport(labReport("r-1"));
    await deviceA.port.labs.putValues([labValue("v-1", "r-1")]);
    await deviceA.sync();
    await deviceB.sync();

    // Act
    await deleteLabReport(deviceA.port, "r-1");
    await deviceA.sync();
    await deviceB.sync();

    // Assert
    expect(await rowsOf(deviceA.db, "labValues", "v-1")).toBeUndefined();
    expect(await rowsOf(deviceB.db, "labValues", "v-1")).toBeUndefined();
    expect(hasTombstone(cloud.state.snapshot, "labValues", "v-1")).toBe(true);
  });
});

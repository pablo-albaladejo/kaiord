/**
 * A deleted profile's rows must not come back from Drive. The profile delete
 * cascades over its per-profile rows without per-row tombstones, and the
 * remote still holds them, so only the `profiles` tombstone can say they are
 * gone. Real Dexie on two devices sharing one in-memory cloud.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { createProfile } from "../../application/profile/create-profile";
import { deleteProfile } from "../../application/profile/delete-profile";
import { deleteProfileWithCascade } from "../../application/profile/delete-profile-with-cascade";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import type { Snapshot } from "../../types/snapshot";
import { createAppPersistence } from "../create-app-persistence";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const names: string[] = [];
const open = async (label: string) => {
  const name = `kaiord-test-deleted-${label}-${Date.now()}-${Math.random()}`;
  names.push(name);
  const db = new KaiordDatabase(name);
  await db.open();
  const persistence = createAppPersistence(db);
  return { db, persistence, snapshotPort: createDexieSnapshotPort(db) };
};

type Device = Awaited<ReturnType<typeof open>>;

const sync = (cloud: CloudSyncPort, device: Device, id: string) =>
  syncWithCloud({ cloud, snapshotPort: device.snapshotPort, deviceId: id });

const STAMP = "2026-10-10T08:00:00.000Z";

const intake = (id: string, profileId: string) => ({
  id,
  profileId,
  date: "2026-10-10",
  loggedAt: STAMP,
  updatedAt: STAMP,
  kcal: 500,
  proteinG: 30,
  carbG: 60,
  fatG: 15,
});

const weight = (id: string, profileId: string) => ({
  id,
  profileId,
  date: "2026-10-10",
  weightKg: 70.4,
  source: "manual",
  createdAt: STAMP,
  updatedAt: STAMP,
});

/** A deletes profile P, which both devices hold with its rows on Drive. */
const deletedOnA = async () => {
  const cloud = createInMemoryCloudSyncPort({
    authenticated: true,
    snapshot: null,
    revision: null,
    pushCount: 0,
  });
  const a = await open("a");
  await createProfile(a.persistence, "Keep");
  const { id: deleted } = await createProfile(a.persistence, "Gone");
  await a.db.table("intakeEntries").put(intake("i-p", deleted));
  await a.db.table("healthWeight").put(weight("w-p", deleted));
  await sync(cloud, a, "dev-a");
  const b = await open("b");
  await sync(cloud, b, "dev-b");
  await a.persistence.transaction(async () => {
    await deleteProfileWithCascade(a.persistence, deleted);
    await deleteProfile(a.persistence, deleted);
  });
  return { cloud, a, b, deleted };
};

const rowsOf = async (device: Device, table: string, profileId: string) =>
  (await device.db.table(table).toArray()).filter(
    (row) => row.profileId === profileId
  );

const pushedRows = (cloud: CloudSyncPort, table: string, profileId: string) =>
  (
    ((cloud as unknown as { state: { snapshot: Snapshot } }).state.snapshot
      .tables[table] ?? []) as Array<{ profileId?: unknown }>
  ).filter((row) => row.profileId === profileId);

afterEach(async () => {
  for (const name of names.splice(0)) await Dexie.delete(name);
});

describe("a deleted profile's rows across a sync", () => {
  it("should neither restore nor push the per-profile rows of a profile deleted on this device", async () => {
    // Arrange
    const { cloud, a, deleted } = await deletedOnA();

    // Act
    await sync(cloud, a, "dev-a");

    // Assert
    for (const table of ["intakeEntries", "healthWeight"]) {
      expect(await rowsOf(a, table, deleted)).toEqual([]);
      expect(pushedRows(cloud, table, deleted)).toEqual([]);
    }
  });

  it("should remove them from the other device on its next sync", async () => {
    // Arrange
    const { cloud, a, b, deleted } = await deletedOnA();
    await sync(cloud, a, "dev-a");

    // Act
    await sync(cloud, b, "dev-b");

    // Assert
    expect(await rowsOf(b, "intakeEntries", deleted)).toEqual([]);
    expect(await rowsOf(b, "healthWeight", deleted)).toEqual([]);
  });

  it("should keep the rows of a profile that has not arrived yet", async () => {
    // Arrange
    const { cloud, a } = await deletedOnA();
    const state = (cloud as unknown as { state: { snapshot: Snapshot } }).state;
    state.snapshot = {
      ...state.snapshot,
      tables: {
        ...state.snapshot.tables,
        intakeEntries: [intake("i-late", "p-late")],
      },
    };

    // Act
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await rowsOf(a, "intakeEntries", "p-late")).toHaveLength(1);
    expect(pushedRows(cloud, "intakeEntries", "p-late")).toHaveLength(1);
  });
});

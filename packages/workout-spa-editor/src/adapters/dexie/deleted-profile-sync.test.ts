/**
 * A deleted profile's rows must not come back from Drive. The profile delete
 * cascades over its per-profile rows without per-row tombstones, and the
 * remote still holds them, so only the `profiles` tombstone can say they are
 * gone. Real Dexie on two devices sharing one in-memory cloud.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createProfile } from "../../application/profile/create-profile";
import { deleteProfile } from "../../application/profile/delete-profile";
import { deleteProfileWithCascade } from "../../application/profile/delete-profile-with-cascade";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { writeAfterExport } from "../../test-utils/write-after-export";
import type { Snapshot } from "../../types/snapshot";
import { createAppPersistence } from "../create-app-persistence";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const databases = {
  a: sharedKaiordDatabase("deleted-a"),
  b: sharedKaiordDatabase("deleted-b"),
};
const open = async (label: keyof typeof databases) => {
  const db = databases[label];
  await db.open();
  const persistence = createAppPersistence(db);
  return { db, persistence, snapshotPort: createDexieSnapshotPort(db) };
};

type Device = Awaited<ReturnType<typeof open>>;

const sync = (cloud: CloudSyncPort, device: Device, id: string) =>
  syncWithCloud({ cloud, snapshotPort: device.snapshotPort, deviceId: id });

const ONE_MINUTE_MS = 60_000;
const STAMP = "2026-10-10T08:00:00.000Z";

const intake = (id: string, profileId: string, updatedAt = STAMP) => ({
  id,
  profileId,
  date: "2026-10-10",
  loggedAt: STAMP,
  updatedAt,
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

const deleteOn = (device: Device, profileId: string) =>
  device.persistence.transaction(async () => {
    await deleteProfileWithCascade(device.persistence, profileId);
    await deleteProfile(device.persistence, profileId);
  });

/** Both devices hold profile P with its rows, synced through Drive. */
const profileOnBothDevices = async () => {
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
  return { cloud, a, b, deleted };
};

/** A deletes profile P, which both devices hold with its rows on Drive. */
const deletedOnA = async () => {
  const devices = await profileOnBothDevices();
  await deleteOn(devices.a, devices.deleted);
  return devices;
};

/** A clock later than the profile tombstone A just wrote. */
const afterTheDelete = () => new Date(Date.now() + ONE_MINUTE_MS).toISOString();

/** B, which has not seen the delete, edits P's intake and logs a new one. */
const editOnB = async (b: Device, deleted: string) => {
  const later = afterTheDelete();
  await b.persistence.intakeEntries.put(intake("i-p", deleted, later));
  await b.persistence.intakeEntries.put(intake("i-new", deleted, later));
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

  it("should neither restore nor push the rows of a profile deleted while a sync is between its export and its import", async () => {
    // Arrange
    const { cloud, a, deleted } = await profileOnBothDevices();
    const racing = writeAfterExport(a.snapshotPort, () => deleteOn(a, deleted));

    // Act
    await syncWithCloud({ cloud, snapshotPort: racing, deviceId: "dev-a" });

    // Assert
    expect(await a.persistence.profiles.getById(deleted)).toBeUndefined();
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

describe("a deleted profile's rows edited on a device that never saw the delete", () => {
  it("should drop them when that device syncs after the delete reached Drive", async () => {
    // Arrange
    const { cloud, a, b, deleted } = await deletedOnA();
    await sync(cloud, a, "dev-a");
    await editOnB(b, deleted);

    // Act
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await rowsOf(b, "intakeEntries", deleted)).toEqual([]);
    expect(await rowsOf(a, "intakeEntries", deleted)).toEqual([]);
    expect(pushedRows(cloud, "intakeEntries", deleted)).toEqual([]);
  });

  it("should drop them when that device pushed its edit before the delete", async () => {
    // Arrange
    const { cloud, a, b, deleted } = await deletedOnA();
    await editOnB(b, deleted);
    await sync(cloud, b, "dev-b");

    // Act
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");

    // Assert
    expect(await rowsOf(a, "intakeEntries", deleted)).toEqual([]);
    expect(await rowsOf(b, "intakeEntries", deleted)).toEqual([]);
    expect(pushedRows(cloud, "intakeEntries", deleted)).toEqual([]);
  });

  it("should bring every row back with the profile when that device edits the profile itself after the delete", async () => {
    // Arrange
    const { cloud, a, b, deleted } = await deletedOnA();
    await sync(cloud, a, "dev-a");
    const profile = await b.persistence.profiles.getById(deleted);
    if (!profile) throw new Error("B should still hold the profile");
    await b.persistence.profiles.put({
      ...profile,
      updatedAt: afterTheDelete(),
    });

    // Act
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await a.persistence.profiles.getById(deleted)).toBeDefined();
    expect(await rowsOf(a, "intakeEntries", deleted)).toHaveLength(1);
    expect(await rowsOf(a, "healthWeight", deleted)).toHaveLength(1);
  });
});

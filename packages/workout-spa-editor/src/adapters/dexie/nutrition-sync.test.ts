/**
 * Nutrition through the real sync pipeline: Dexie on two devices sharing one
 * in-memory cloud, writes and deletes made through the app's persistence (so
 * deletes are tombstoned exactly as in production).
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { exportBackup } from "../../application/backup/export-backup";
import { importBackup } from "../../application/backup/import-backup";
import { parseBackup } from "../../application/backup/parse-backup";
import { createProfile } from "../../application/profile/create-profile";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { writeAfterExport } from "../../test-utils/write-after-export";
import type { IntakeEntryRecord } from "../../types/intake-entry-record";
import { createAppPersistence } from "../create-app-persistence";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const NEWER_KCAL = 750;
const OLDER_KCAL = 600;

const databases = {
  a: sharedKaiordDatabase("nutrition-a"),
  b: sharedKaiordDatabase("nutrition-b"),
};
const open = async (label: keyof typeof databases) => {
  const db = databases[label];
  await db.open();
  return {
    db,
    persistence: createAppPersistence(db),
    snapshotPort: createDexieSnapshotPort(db),
  };
};

type Device = Awaited<ReturnType<typeof open>>;

const sync = (cloud: CloudSyncPort, device: Device, id: string) =>
  syncWithCloud({ cloud, snapshotPort: device.snapshotPort, deviceId: id });

const entry = (
  profileId: string,
  kcal: number,
  updatedAt: string
): IntakeEntryRecord => ({
  id: "i-1",
  profileId,
  date: "2026-10-10",
  loggedAt: "2026-10-10T08:00:00.000Z",
  updatedAt,
  kcal,
  proteinG: 30,
  carbG: 60,
  fatG: 15,
});

/** Device A owns a profile and has synced it; device B has pulled it. */
const twoDevices = async () => {
  const cloud = createInMemoryCloudSyncPort({
    authenticated: true,
    snapshot: null,
    revision: null,
    pushCount: 0,
  });
  const a = await open("a");
  const { id: profileId } = await createProfile(a.persistence, "Ana");
  await sync(cloud, a, "dev-a");
  const b = await open("b");
  await sync(cloud, b, "dev-b");
  return { cloud, a, b, profileId };
};

describe("nutrition sync between two devices", () => {
  it("should give device B an intake device A created", async () => {
    // Arrange
    const { cloud, a, b, profileId } = await twoDevices();
    const created = entry(profileId, 500, "2026-10-10T08:00:00.000Z");
    await a.persistence.intakeEntries.put(created);

    // Act
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");

    // Assert
    expect(await b.persistence.intakeEntries.getById("i-1")).toEqual(created);
  });

  it("should remove from device B an intake device A deleted", async () => {
    // Arrange
    const { cloud, a, b, profileId } = await twoDevices();
    await a.persistence.intakeEntries.put(
      entry(profileId, 500, "2026-10-10T08:00:00.000Z")
    );
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");
    await a.persistence.intakeEntries.delete("i-1");

    // Act
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await b.persistence.intakeEntries.getById("i-1")).toBeUndefined();
    expect(await a.persistence.intakeEntries.getById("i-1")).toBeUndefined();
  });

  it("should keep the newest of two edits made on two devices", async () => {
    // Arrange
    const { cloud, a, b, profileId } = await twoDevices();
    await a.persistence.intakeEntries.put(
      entry(profileId, 500, "2026-10-10T08:00:00.000Z")
    );
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");
    const newer = entry(profileId, NEWER_KCAL, "2026-10-10T12:00:00.000Z");
    await b.persistence.intakeEntries.put(newer);
    await a.persistence.intakeEntries.put(
      entry(profileId, OLDER_KCAL, "2026-10-10T10:00:00.000Z")
    );

    // Act
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");

    // Assert
    expect(await a.persistence.intakeEntries.getById("i-1")).toEqual(newer);
    expect(await b.persistence.intakeEntries.getById("i-1")).toEqual(newer);
  });

  it("should keep an intake deleted on device A when device B imports an older backup", async () => {
    // Arrange
    const { cloud, a, b, profileId } = await twoDevices();
    await a.persistence.intakeEntries.put(
      entry(profileId, 500, "2026-10-10T08:00:00.000Z")
    );
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");
    const older = JSON.stringify(
      await exportBackup({ port: b.snapshotPort, deviceId: "dev-b" })
    );
    await a.persistence.intakeEntries.delete("i-1");
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");

    // Act
    await importBackup({
      port: b.snapshotPort,
      deviceId: "dev-b",
      backup: parseBackup(older),
    });
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await b.persistence.intakeEntries.getById("i-1")).toBeUndefined();
    expect(await a.persistence.intakeEntries.getById("i-1")).toBeUndefined();
  });

  it("should keep an intake logged while a sync is between its export and its import", async () => {
    // Arrange
    const { cloud, a, profileId } = await twoDevices();
    const logged = entry(profileId, 500, "2026-10-11T08:00:00.000Z");
    const racing = writeAfterExport(a.snapshotPort, () =>
      a.persistence.intakeEntries.put(logged)
    );

    // Act
    await syncWithCloud({ cloud, snapshotPort: racing, deviceId: "dev-a" });
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await a.persistence.intakeEntries.getById("i-1")).toEqual(logged);
    const pushed = cloud.state.snapshot?.tables.intakeEntries ?? [];
    expect(pushed).toEqual([logged]);
  });

  it("should keep an intake edited while a sync is between its export and its import", async () => {
    // Arrange
    const { cloud, a, profileId } = await twoDevices();
    await a.persistence.intakeEntries.put(
      entry(profileId, 500, "2026-10-10T08:00:00.000Z")
    );
    await sync(cloud, a, "dev-a");
    const edited = entry(profileId, NEWER_KCAL, "2026-10-11T08:00:00.000Z");
    const racing = writeAfterExport(a.snapshotPort, () =>
      a.persistence.intakeEntries.put(edited)
    );

    // Act
    await syncWithCloud({ cloud, snapshotPort: racing, deviceId: "dev-a" });

    // Assert
    expect(await a.persistence.intakeEntries.getById("i-1")).toEqual(edited);
  });

  it("should keep an intake deleted while a sync is between its export and its import deleted", async () => {
    // Arrange
    const { cloud, a, profileId } = await twoDevices();
    await a.persistence.intakeEntries.put(
      entry(profileId, 500, "2026-10-10T08:00:00.000Z")
    );
    await sync(cloud, a, "dev-a");
    const racing = writeAfterExport(a.snapshotPort, () =>
      a.persistence.intakeEntries.delete("i-1")
    );

    // Act
    await syncWithCloud({ cloud, snapshotPort: racing, deviceId: "dev-a" });

    // Assert
    expect(await a.persistence.intakeEntries.getById("i-1")).toBeUndefined();
    expect(cloud.state.snapshot?.tables.intakeEntries ?? []).toEqual([]);
    expect(cloud.state.snapshot?.tombstones).toContainEqual(
      expect.objectContaining({ table: "intakeEntries", id: "i-1" })
    );
  });
});

import { describe, expect, it } from "vitest";

import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import type { KaiordBackup } from "../../types/backup";
import type { Tombstone } from "../../types/snapshot";
import { importBackup } from "./import-backup";
import { BackupFileError } from "./parse-backup";

type Row = Record<string, unknown>;

const LOCAL_KCAL = 900;
const NOW = new Date("2026-10-11T09:00:00.000Z");
const BACKUP_AT = "2026-10-10T08:00:00.000Z";

const intake = (
  id: string,
  profileId: string,
  kcal = 500,
  updatedAt = "2026-10-09T08:00:00.000Z"
) => ({
  id,
  profileId,
  date: "2026-10-09",
  loggedAt: "2026-10-09T08:00:00.000Z",
  updatedAt,
  kcal,
  proteinG: 30,
  carbG: 50,
  fatG: 15,
});

const workout = (id: string, profileId: string, updatedAt: string) => ({
  id,
  profileId,
  name: `${id}@${updatedAt}`,
  updatedAt,
});

const backupOf = (
  tables: Record<string, Row[]>,
  extra: Partial<KaiordBackup> = {}
): KaiordBackup => ({
  format: "kaiord-backup",
  version: 2,
  manifest: {
    schemaVersion: 40,
    deviceId: "dev-b",
    exportedAt: BACKUP_AT,
    encrypted: false,
  },
  tables,
  tombstones: [],
  ...extra,
});

const deviceWith = (
  tables: Record<string, Row[]>,
  deviceLocal: Record<string, Row[]> = {},
  tombstones: Tombstone[] = []
) => {
  const state = { schemaVersion: 40, tables, tombstones, deviceLocal };
  return { state, port: createInMemorySnapshotPort(state) };
};

const run = (
  device: ReturnType<typeof deviceWith>,
  backup: KaiordBackup,
  choice?: string
) =>
  importBackup({
    port: device.port,
    deviceId: "dev-a",
    backup,
    choice,
    now: () => NOW,
  });

const ana = { id: "p-ana", name: "Ana", origin: "local" };
const auto = { id: "p-auto", name: "Mi perfil", origin: "auto" };

const freshDevice = () =>
  deviceWith(
    {
      profiles: [auto],
      workouts: [workout("w-auto", "p-auto", "2026-10-11T07:00:00.000Z")],
      intakeEntries: [intake("i-auto", "p-auto")],
      meta: [{ key: "activeProfileId", value: "p-auto" }],
    },
    { connections: [{ profileId: "p-auto", providerId: "whoop" }] }
  );

const anaBackup = () =>
  backupOf({
    profiles: [ana],
    workouts: [workout("w-1", "p-ana", BACKUP_AT)],
    intakeEntries: [intake("i-1", "p-ana")],
    meta: [{ key: "activeProfileId", value: "p-ana" }],
  });

describe("importBackup", () => {
  it("should fold a fresh device's default profile into the backup's single profile", async () => {
    // Arrange
    const device = freshDevice();

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(result.kind).toBe("imported");
    const { tables, deviceLocal } = device.state;
    expect(tables.profiles).toEqual([ana]);
    expect(tables.workouts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "w-1", profileId: "p-ana" }),
        expect.objectContaining({ id: "w-auto", profileId: "p-ana" }),
      ])
    );
    expect(tables.intakeEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "i-1", profileId: "p-ana" }),
        expect.objectContaining({ id: "i-auto", profileId: "p-ana" }),
      ])
    );
    expect(deviceLocal.connections).toEqual([
      { profileId: "p-ana", providerId: "whoop" },
    ]);
    expect(tables.meta).toEqual([{ key: "activeProfileId", value: "p-ana" }]);
    expect(JSON.stringify(device.state)).not.toContain("p-auto");
  });

  it("should leave the database unchanged when imported twice", async () => {
    // Arrange
    const device = freshDevice();
    await run(device, anaBackup());
    const once = JSON.stringify(device.state);

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(JSON.stringify(device.state)).toBe(once);
    expect(result).toMatchObject({
      kind: "imported",
      summary: { added: 0, updated: 0, notRestored: 0 },
    });
  });

  it("should not overwrite a newer local row with the backup's older one", async () => {
    // Arrange
    const newer = workout("w-1", "p-ana", "2026-10-11T07:00:00.000Z");
    const device = deviceWith({ profiles: [ana], workouts: [newer] });

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(device.state.tables.workouts).toEqual([newer]);
    expect(result).toMatchObject({ summary: { updated: 0 } });
  });

  it("should restore an older local row from the backup's newer one", async () => {
    // Arrange
    const older = workout("w-1", "p-ana", "2026-10-01T07:00:00.000Z");
    const device = deviceWith({ profiles: [ana], workouts: [older] });

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(device.state.tables.workouts).toEqual([
      workout("w-1", "p-ana", BACKUP_AT),
    ]);
    expect(result).toMatchObject({ summary: { updated: 1 } });
  });

  it("should keep a row deleted after the backup deleted and count it", async () => {
    // Arrange
    const deleted: Tombstone = {
      table: "workouts",
      id: "w-1",
      deletedAt: "2026-10-11T06:00:00.000Z",
    };
    const device = deviceWith({ profiles: [ana], workouts: [] }, {}, [deleted]);

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(device.state.tables.workouts).toEqual([]);
    expect(device.state.tombstones).toEqual([deleted]);
    expect(result).toMatchObject({ summary: { notRestored: 1 } });
  });

  it("should reject a backup from a newer schema without writing anything", async () => {
    // Arrange
    const device = freshDevice();
    const before = JSON.stringify(device.state);
    const backup = anaBackup();
    const newer = { ...backup.manifest, schemaVersion: 41 };

    // Act
    const attempt = run(device, { ...backup, manifest: newer });

    // Assert
    await expect(attempt).rejects.toBeInstanceOf(BackupFileError);
    await expect(attempt).rejects.toMatchObject({ reason: "newerApp" });
    expect(JSON.stringify(device.state)).toBe(before);
  });

  it("should ignore cursors, connections and API keys a tampered file carries", async () => {
    // Arrange
    const localCursor = { source: "garmin", cursor: "local" };
    const device = deviceWith(
      { profiles: [ana], syncState: [localCursor] },
      { connections: [{ profileId: "p-ana", providerId: "whoop" }] }
    );
    const backup = backupOf({
      profiles: [ana],
      syncState: [{ source: "garmin", cursor: "file" }],
      coachingSyncState: [{ source: "train2go", profileId: "p-ana" }],
      connections: [{ profileId: "p-ana", providerId: "evil" }],
      aiProviders: [{ id: "ai-1", label: "Mine", apiKey: "stolen" }],
    });

    // Act
    await run(device, backup);

    // Assert
    const { tables, deviceLocal } = device.state;
    expect(tables.syncState).toEqual([localCursor]);
    expect(tables.coachingSyncState ?? []).toEqual([]);
    expect(deviceLocal.connections).toEqual([
      { profileId: "p-ana", providerId: "whoop" },
    ]);
    expect(JSON.stringify(device.state)).not.toContain("stolen");
  });

  it("should keep the local API key and mark a provider only the file has as missing its key", async () => {
    // Arrange
    const local = { id: "ai-1", label: "Old", apiKey: "cipher", createdAt: 1 };
    const device = deviceWith({ profiles: [ana], aiProviders: [local] });
    const backup = backupOf({
      profiles: [ana],
      aiProviders: [
        { id: "ai-1", label: "Renamed", createdAt: 1 },
        { id: "ai-2", label: "Other", isDefault: true, createdAt: 2 },
      ],
    });

    // Act
    await run(device, backup);

    // Assert
    const rows = device.state.tables.aiProviders as Row[];
    expect(rows.find((r) => r.id === "ai-1")).toMatchObject({
      apiKey: "cipher",
    });
    const imported = rows.find((r) => r.id === "ai-2");
    expect(imported).toMatchObject({ label: "Other", apiKeyMissing: true });
    expect(imported).not.toHaveProperty("apiKey");
  });

  it("should keep an intake deleted after the backup deleted and count it", async () => {
    // Arrange
    const deleted: Tombstone = {
      table: "intakeEntries",
      id: "i-1",
      deletedAt: "2026-10-11T06:00:00.000Z",
    };
    const device = deviceWith({ profiles: [ana], intakeEntries: [] }, {}, [
      deleted,
    ]);

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(device.state.tables.intakeEntries).toEqual([]);
    expect(device.state.tombstones).toEqual([deleted]);
    expect(result).toEqual({
      kind: "imported",
      summary: { added: 1, updated: 0, notRestored: 1 },
    });
  });

  it("should keep the local intake when it is newer than the backup's copy", async () => {
    // Arrange
    const local = intake(
      "i-1",
      "p-ana",
      LOCAL_KCAL,
      "2026-10-11T07:00:00.000Z"
    );
    const device = deviceWith({ profiles: [ana], intakeEntries: [local] });

    // Act
    await run(device, anaBackup());

    // Assert
    expect(device.state.tables.intakeEntries).toEqual([local]);
  });

  it("should restore the backup's intake when it is newer than the local copy", async () => {
    // Arrange
    const local = intake(
      "i-1",
      "p-ana",
      LOCAL_KCAL,
      "2026-10-01T07:00:00.000Z"
    );
    const device = deviceWith({ profiles: [ana], intakeEntries: [local] });

    // Act
    const result = await run(device, anaBackup());

    // Assert
    expect(device.state.tables.intakeEntries).toEqual([intake("i-1", "p-ana")]);
    expect(result).toMatchObject({ summary: { updated: 1 } });
  });

  it("should ask which profile to join when the file has several, changing nothing", async () => {
    // Arrange
    const device = freshDevice();
    const before = JSON.stringify(device.state);
    const bea = { id: "p-bea", name: "Bea" };
    const backup = backupOf({ profiles: [ana, bea] });

    // Act
    const result = await run(device, backup);

    // Assert
    expect(result).toEqual({
      kind: "needsChoice",
      candidates: [
        { id: "p-ana", name: "Ana" },
        { id: "p-bea", name: "Bea" },
      ],
    });
    expect(JSON.stringify(device.state)).toBe(before);
  });

  it("should move the default profile's rows onto the profile the user picks", async () => {
    // Arrange
    const device = freshDevice();
    const bea = { id: "p-bea", name: "Bea" };
    const backup = backupOf({ profiles: [ana, bea] });

    // Act
    await run(device, backup, "p-bea");

    // Assert
    const { tables, deviceLocal } = device.state;
    expect(tables.profiles).toEqual([ana, bea]);
    expect(tables.workouts).toEqual([
      expect.objectContaining({ id: "w-auto", profileId: "p-bea" }),
    ]);
    expect(tables.intakeEntries).toEqual([
      expect.objectContaining({ id: "i-auto", profileId: "p-bea" }),
    ]);
    expect(deviceLocal.connections).toEqual([
      { profileId: "p-bea", providerId: "whoop" },
    ]);
    expect(tables.meta).toEqual([{ key: "activeProfileId", value: "p-bea" }]);
  });

  it("should keep the local profile active next to the backup's profile", async () => {
    // Arrange
    const mine = { id: "p-mine", name: "Mine", origin: "local" };
    const device = deviceWith({
      profiles: [mine],
      meta: [{ key: "activeProfileId", value: "p-mine" }],
    });

    // Act
    await run(device, anaBackup());

    // Assert
    expect(device.state.tables.profiles).toEqual([mine, ana]);
    expect(device.state.tables.meta).toEqual([
      { key: "activeProfileId", value: "p-mine" },
    ]);
  });

  it("should adopt the backup's active profile when the device has none", async () => {
    // Arrange
    const device = deviceWith({ profiles: [], meta: [] });

    // Act
    await run(device, anaBackup());

    // Assert
    expect(device.state.tables.meta).toEqual([
      { key: "activeProfileId", value: "p-ana" },
    ]);
  });

  it("should not import intakes of a profile deleted after the backup", async () => {
    // Arrange
    const gone: Tombstone = {
      table: "profiles",
      id: "p-ana",
      deletedAt: "2026-10-11T06:00:00.000Z",
    };
    const device = deviceWith({ profiles: [] }, {}, [gone]);

    // Act
    await run(device, anaBackup());

    // Assert
    expect(device.state.tables.profiles).toEqual([]);
    expect(device.state.tables.intakeEntries ?? []).toEqual([]);
  });

  it("should keep the profile when a browser imports its own backup", async () => {
    // Arrange
    const device = freshDevice();
    const own = backupOf({
      profiles: [{ ...auto, origin: "local" }],
      workouts: [workout("w-auto", "p-auto", "2026-10-11T07:00:00.000Z")],
      meta: [{ key: "activeProfileId", value: "p-auto" }],
    });

    // Act
    const result = await run(device, own);

    // Assert
    expect(device.state.tables.profiles).toEqual([
      expect.objectContaining({ id: "p-auto", origin: "local" }),
    ]);
    expect(device.state.tables.workouts).toEqual([
      expect.objectContaining({ id: "w-auto", profileId: "p-auto" }),
    ]);
    expect(device.state.tables.intakeEntries).toEqual([
      expect.objectContaining({ id: "i-auto", profileId: "p-auto" }),
    ]);
    expect(result).toMatchObject({ summary: { added: 0, notRestored: 0 } });
  });

  it("should keep the newest energy target of each profile when merging the backup's", async () => {
    // Arrange
    const target = (profileId: string, updatedAt: string) => ({
      profileId,
      goalType: "maintain" as const,
      startWeightKg: 70,
      targetWeightKg: 70,
      targetDate: "2026-12-31",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt,
    });
    const mine = { id: "p-mine", name: "Mine", origin: "local" };
    const ownTarget = target("p-mine", "2026-10-01T00:00:00.000Z");
    const device = deviceWith({
      profiles: [mine, ana],
      energyTargets: [ownTarget, target("p-ana", "2026-10-11T00:00:00.000Z")],
    });
    const backup = backupOf({
      profiles: [mine, ana],
      energyTargets: [
        target("p-mine", BACKUP_AT),
        target("p-ana", "2026-10-02T00:00:00.000Z"),
      ],
    });

    // Act
    await run(device, backup);

    // Assert
    expect(device.state.tables.energyTargets).toEqual([
      target("p-mine", BACKUP_AT),
      target("p-ana", "2026-10-11T00:00:00.000Z"),
    ]);
  });
});

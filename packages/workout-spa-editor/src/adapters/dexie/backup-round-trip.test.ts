/**
 * Backup export → file → import through Dexie on both devices: the file is
 * serialized and parsed as the browser does, and the importing device starts
 * as a clean browser with its unclaimed default profile.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { exportBackup } from "../../application/backup/export-backup";
import { importBackup } from "../../application/backup/import-backup";
import { parseBackup } from "../../application/backup/parse-backup";
import { createProfile } from "../../application/profile/create-profile";
import { ensureDefaultProfile } from "../../application/profile/ensure-default-profile";
import type { SnapshotPort } from "../../ports/snapshot-port";
import { createAppPersistence } from "../create-app-persistence";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const names: string[] = [];
const open = async (label: string) => {
  const name = `kaiord-test-backup-${label}-${Date.now()}-${Math.random()}`;
  names.push(name);
  const db = new KaiordDatabase(name);
  await db.open();
  return {
    db,
    persistence: createAppPersistence(db),
    snapshotPort: createDexieSnapshotPort(db),
  };
};

const intake = (id: string, profileId: string) => ({
  id,
  profileId,
  date: "2026-10-09",
  loggedAt: "2026-10-09T08:00:00.000Z",
  kcal: 437,
  proteinG: 30,
  carbG: 50,
  fatG: 15,
});

/** Device B: a real profile with a workout, an intake and a keyed provider. */
const backupFromB = async (): Promise<{ file: string; target: string }> => {
  const b = await open("b");
  const { id } = await createProfile(b.persistence, "Ana");
  await b.db.table("workouts").put({
    id: "w-b",
    profileId: id,
    updatedAt: "2026-10-09T08:00:00.000Z",
  });
  await b.persistence.intakeEntries.put(intake("i-b", id));
  await b.persistence.aiProviders.put({
    id: "ai-b",
    type: "anthropic",
    apiKey: "sk-secret-b",
    label: "Ana's key",
    isDefault: true,
    createdAt: 1,
  });
  const backup = await exportBackup({
    port: b.snapshotPort,
    nutrition: b.persistence,
    deviceId: "dev-b",
  });
  return { file: JSON.stringify(backup), target: id };
};

/** Device A: a clean browser whose default profile already holds a row. */
const cleanBrowser = async () => {
  const a = await open("a");
  const auto = await ensureDefaultProfile(a.persistence, "Mi perfil");
  if (!auto) throw new Error("auto profile not created");
  await a.db.table("workouts").put({
    id: "w-a",
    profileId: auto.id,
    updatedAt: "2026-10-10T08:00:00.000Z",
  });
  await a.persistence.intakeEntries.put(intake("i-a", auto.id));
  return { ...a, autoId: auto.id };
};

const dump = async (db: KaiordDatabase) => {
  const out: Record<string, unknown[]> = {};
  for (const table of db.tables) out[table.name] = await table.toArray();
  return out;
};

const runImport = (port: SnapshotPort, file: string) =>
  importBackup({ port, deviceId: "dev-a", backup: parseBackup(file) });

afterEach(async () => {
  for (const name of names.splice(0)) await Dexie.delete(name);
});

describe("backup round trip", () => {
  it("should restore every record into a clean browser under one profile", async () => {
    // Arrange
    const { file, target } = await backupFromB();
    const a = await cleanBrowser();

    // Act
    const result = await runImport(a.snapshotPort, file);

    // Assert
    expect(result.kind).toBe("imported");
    const profiles = await a.db.table("profiles").toArray();
    expect(profiles).toEqual([expect.objectContaining({ id: target })]);
    for (const id of ["w-a", "w-b"])
      expect(await a.db.table("workouts").get(id)).toMatchObject({
        profileId: target,
      });
    for (const id of ["i-a", "i-b"])
      expect(await a.db.table("intakeEntries").get(id)).toMatchObject({
        profileId: target,
      });
    expect(await a.db.table("meta").get("activeProfileId")).toMatchObject({
      value: target,
    });
    expect(JSON.stringify(await dump(a.db))).not.toContain(a.autoId);
  });

  it("should list an imported provider as missing its key and never use the file's", async () => {
    // Arrange
    const { file } = await backupFromB();
    const a = await cleanBrowser();

    // Act
    await runImport(a.snapshotPort, file);

    // Assert
    expect(file).not.toContain("sk-secret-b");
    expect(await a.persistence.aiProviders.getAll()).toEqual([
      expect.objectContaining({ id: "ai-b", apiKey: "", apiKeyMissing: true }),
    ]);
  });

  it("should roll back the whole import when the device-local write fails", async () => {
    // Arrange
    const { file } = await backupFromB();
    const a = await cleanBrowser();
    const before = await dump(a.db);
    const failing: SnapshotPort = {
      ...a.snapshotPort,
      updateDeviceLocal: async () => {
        throw new Error("device-local write failed");
      },
    };

    // Act
    const attempt = runImport(failing, file);

    // Assert
    await expect(attempt).rejects.toThrow("device-local write failed");
    expect(await dump(a.db)).toEqual(before);
  });
});

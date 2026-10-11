/**
 * Default-profile guarantees that need a real IndexedDB: the re-key rule
 * coverage over the live schema, checked against a hand-written table list, the atomicity of the import plus the
 * device-local re-key, and the two-tab creation race.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { ensureDefaultProfile } from "../../application/profile/ensure-default-profile";
import {
  AUTO_PROFILE_REKEY_RULES,
  DEVICE_LOCAL_REKEY_TABLES,
} from "../../application/sync/auto-profile-rekey-rules";
import { exportSnapshot } from "../../application/sync/export-snapshot";
import { importReconciledSnapshot } from "../../application/sync/import-reconciled-snapshot";
import { rekeySnapshot } from "../../application/sync/rekey-snapshot";
import {
  DEVICE_LOCAL_TABLES,
  PER_PROFILE_TABLES,
  PROVENANCE_TABLES,
} from "../../test-utils/per-profile-tables";
import { createAppPersistence } from "../create-app-persistence";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const names: string[] = [];
const freshName = () => {
  const name = `kaiord-test-autoprofile-dexie-${Date.now()}-${Math.random()}`;
  names.push(name);
  return name;
};

afterEach(async () => {
  for (const name of names.splice(0)) await Dexie.delete(name);
});

describe("default profile on Dexie", () => {
  it("should classify exactly the hand-listed tables as per-profile", async () => {
    // Arrange
    const db = new KaiordDatabase(freshName());
    await db.open();

    // Act
    const perProfile = createDexieSnapshotPort(db).perProfileTables();
    db.close();

    // Assert
    expect([...perProfile].sort()).toEqual(PER_PROFILE_TABLES);
    expect([...DEVICE_LOCAL_REKEY_TABLES].sort()).toEqual(DEVICE_LOCAL_TABLES);
  });

  it("should have a re-key rule for every hand-listed per-profile table", () => {
    // Arrange
    const needed = PER_PROFILE_TABLES;

    // Act
    const missing = needed.filter((t) => !(t in AUTO_PROFILE_REKEY_RULES));

    // Assert
    expect(missing).toEqual([]);
  });

  it("should give every provenance-indexed table a provenance natural key", async () => {
    // Arrange
    const db = new KaiordDatabase(freshName());
    await db.open();
    const provenance = ["profileId", "sourceBridgeId", "externalId"];

    // Act
    const indexed = db.tables
      .filter((t) =>
        t.schema.indexes.some((i) => i.name === `[${provenance.join("+")}]`)
      )
      .map((t) => t.name);
    db.close();
    const unkeyed = indexed.filter(
      (t) =>
        !AUTO_PROFILE_REKEY_RULES[t]?.uniqueKeys?.some(
          (k) => k.join() === provenance.join()
        )
    );

    // Assert
    expect([...indexed].sort()).toEqual(PROVENANCE_TABLES);
    expect(unkeyed).toEqual([]);
  });

  it("should roll back both the import and the device-local re-key when a step after them throws", async () => {
    // Arrange
    const db = new KaiordDatabase(freshName());
    await db.open();
    const port = createDexieSnapshotPort(db);
    const auto = await ensureDefaultProfile(
      createAppPersistence(db),
      "Mi perfil"
    );
    const from = auto?.id ?? "";
    await db.table("workouts").put({ id: "w-1", profileId: from });
    await db.table("intakeEntries").put({ id: "i-1", profileId: from });
    const rekey = { from: [from], to: "22222222-2222-4222-8222-222222222222" };
    const local = await exportSnapshot({ port, deviceId: "dev-a" });
    const snapshot = rekeySnapshot(local, rekey, port.perProfileTables());
    const failing = {
      ...port,
      updateDeviceLocal: async (
        fn: Parameters<typeof port.updateDeviceLocal>[0]
      ) => {
        await port.updateDeviceLocal(fn);
        throw new Error("boom after re-key");
      },
    };

    // Act
    const run = importReconciledSnapshot({
      port: failing,
      snapshot,
      deviceLocalRekey: rekey,
    });

    // Assert
    await expect(run).rejects.toThrow("boom after re-key");
    expect(await db.table("workouts").get("w-1")).toMatchObject({
      profileId: from,
    });
    expect(await db.table("intakeEntries").get("i-1")).toMatchObject({
      profileId: from,
    });
    expect(await db.table("profiles").get(from)).toBeDefined();
    db.close();
  });

  it("should create exactly one default profile when two tabs boot at once", async () => {
    // Arrange
    const name = freshName();
    const tabA = new KaiordDatabase(name);
    const tabB = new KaiordDatabase(name);
    await tabA.open();
    await tabB.open();

    // Act
    const created = await Promise.all([
      ensureDefaultProfile(createAppPersistence(tabA), "Mi perfil"),
      ensureDefaultProfile(createAppPersistence(tabB), "Mi perfil"),
    ]);

    // Assert
    const profiles = await tabA.table("profiles").toArray();
    expect(profiles).toHaveLength(1);
    expect(created.filter((p) => p !== null)).toHaveLength(1);
    expect(await tabB.table("meta").get("activeProfileId")).toMatchObject({
      value: profiles[0]?.id,
    });
    tabA.close();
    tabB.close();
  });
});

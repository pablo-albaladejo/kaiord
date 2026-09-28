/**
 * Dexie SnapshotPort adapter — whole-database dump/restore over a real
 * (fake-indexeddb) Dexie instance, including the encrypted-aiProviders
 * round-trip mandated by spa-cloud-sync.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exportSnapshot } from "../../application/sync/export-snapshot";
import { importSnapshot } from "../../application/sync/import-snapshot";
import { mergeSnapshots } from "../../application/sync/merge-snapshots";
import { decrypt, encrypt } from "../../lib/crypto";
import type { Snapshot } from "../../types/snapshot";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const dbName = () => `kaiord-test-snapshot-${Date.now()}-${Math.random()}`;

const PASSPHRASE = "kaiord-spa-v1";
// Current head version KaiordDatabase opens at; v24 added the device-local
// `connections` store (excluded from the snapshot), v25 added chatConversations
// + the conversationId FK, v26 added the device-local energy-balance stores
// (`intakeEntries`, `intakePresets`, `energyTargets`), also excluded, v31 added
// the lab-analytics stores (`labReports`, `labValues`, included), v33 dropped
// the legacy `usage` store, making `usageEvents` the synced usage source, v34
// added the healthStrain + healthVitals stores (included), v35 added the
// healthHeartRateSeries store (included), and v36 normalized Garmin ledger rows
// (no store change).
const SCHEMA_HEAD = 36;

describe("createDexieSnapshotPort", () => {
  let name: string;

  beforeEach(() => {
    name = dbName();
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should export every table including the schema version", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("workouts").add({ id: "w-1", profileId: "p-1" });
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.manifest.schemaVersion).toBe(SCHEMA_HEAD);
    expect(snapshot.tables.workouts).toHaveLength(1);
    expect(snapshot.tables).toHaveProperty("templates");
  });

  it.each([
    {
      store: "connections",
      row: {
        profileId: "p-1",
        providerId: "intervals",
        status: "connected",
        mechanism: "api-key",
        updatedAt: "2026-06-19T00:00:00.000Z",
      },
    },
    {
      store: "intakeEntries",
      row: {
        id: "i-1",
        profileId: "p-1",
        date: "2026-06-21",
        loggedAt: "2026-06-21T08:00:00.000Z",
        kcal: 600,
        proteinG: 40,
        carbG: 60,
        fatG: 20,
      },
    },
    {
      store: "intakePresets",
      row: {
        id: "pre-1",
        profileId: "p-1",
        label: "breakfast",
        kcal: 400,
        proteinG: 20,
        carbG: 50,
        fatG: 10,
        createdAt: "2026-06-21T08:00:00.000Z",
      },
    },
    {
      store: "energyTargets",
      row: {
        profileId: "p-1",
        goalType: "fat_loss",
        startWeightKg: 80,
        targetWeightKg: 75,
        targetDate: "2026-09-01",
        createdAt: "2026-06-21T08:00:00.000Z",
        updatedAt: "2026-06-21T08:00:00.000Z",
      },
    },
  ])(
    "should exclude the device-local $store store from the export",
    async ({ store, row }) => {
      // Arrange
      const db = new KaiordDatabase(name);
      await db.open();
      await db.table(store).add(row);
      const port = createDexieSnapshotPort(db);

      // Act
      const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
      db.close();

      // Assert
      expect(snapshot.tables).not.toHaveProperty(store);
    }
  );

  it.each([
    {
      store: "usageEvents",
      row: {
        id: "evt-1",
        yearMonth: "2026-07",
        date: "2026-07-10",
        purpose: "chat",
        providerType: "anthropic",
        promptTokens: 120,
        completionTokens: 80,
        tokens: 200,
        cost: 0.0006,
        createdAt: "2026-07-10T10:00:00.000Z",
      },
    },
    {
      store: "chatMessages",
      row: {
        id: "c-1",
        profileId: "p-1",
        conversationId: "conv-1",
        role: "user",
        content: "hi",
        createdAt: "2026-06-13T10:00:00.000Z",
      },
    },
    {
      store: "chatConversations",
      row: {
        id: "conv-1",
        profileId: "p-1",
        title: "Cycling",
        createdAt: "2026-06-13T10:00:00.000Z",
        updatedAt: "2026-06-13T10:00:00.000Z",
      },
    },
  ])(
    "should include the $store store in the export",
    async ({ store, row }) => {
      // Arrange
      const db = new KaiordDatabase(name);
      await db.open();
      await db.table(store).add(row);
      const port = createDexieSnapshotPort(db);

      // Act
      const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
      db.close();

      // Assert
      expect(snapshot.tables[store]).toHaveLength(1);
    }
  );

  it("should round-trip a cleared database back to its original rows", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("workouts").add({ id: "w-1", profileId: "p-1" });
    await db.table("templates").add({ id: "t-1", sport: "cycling" });
    const port = createDexieSnapshotPort(db);
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });

    // Act
    await db.table("workouts").clear();
    await db.table("templates").clear();
    await importSnapshot({ port, snapshot });
    const workouts = await db.table("workouts").toArray();
    const templates = await db.table("templates").toArray();
    db.close();

    // Assert
    expect(workouts).toEqual([{ id: "w-1", profileId: "p-1" }]);
    expect(templates).toEqual([{ id: "t-1", sport: "cycling" }]);
  });

  it("should preserve an encrypted aiProviders key that decrypts after import", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    const encryptedKey = await encrypt("sk-secret-123", PASSPHRASE);
    await db.table("aiProviders").add({ id: "ai-1", encryptedKey });
    const port = createDexieSnapshotPort(db);
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });

    // Act
    await db.table("aiProviders").clear();
    await importSnapshot({ port, snapshot });
    const row = (await db.table("aiProviders").get("ai-1")) as {
      encryptedKey: string;
    };
    const decrypted = await decrypt(row.encryptedKey, PASSPHRASE);
    db.close();

    // Assert
    expect(decrypted).toBe("sk-secret-123");
  });

  it("should roll the whole import back when a later phase fails (atomic)", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("workouts").add({ id: "original", profileId: "p-1" });
    const base = createDexieSnapshotPort(db);
    const snapshot = await exportSnapshot({ port: base, deviceId: "dev-1" });
    const imported = {
      ...snapshot,
      tables: { ...snapshot.tables, workouts: [{ id: "imported" }] },
    };
    // The tombstone phase fails *after* importTables has written in the
    // same transaction; the whole transaction must roll back.
    const failing = {
      ...base,
      replaceTombstones: async () => {
        throw new Error("simulated mid-restore failure");
      },
    };

    // Act
    const attempt = importSnapshot({ port: failing, snapshot: imported });

    // Assert
    await expect(attempt).rejects.toThrow(/mid-restore/i);
    const workouts = await db.table("workouts").toArray();
    db.close();
    expect(workouts).toEqual([{ id: "original", profileId: "p-1" }]);
  });

  it("should round-trip tombstones via the dedicated tombstone methods", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    const port = createDexieSnapshotPort(db);
    await port.replaceTombstones([
      { table: "workouts", id: "gone", deletedAt: "2026-05-20T00:00:00Z" },
    ]);

    // Act
    const listed = await port.listTombstones();
    db.close();

    // Assert
    expect(listed).toEqual([
      { table: "workouts", id: "gone", deletedAt: "2026-05-20T00:00:00Z" },
    ]);
  });
});

// The last schema before Garmin ledger rows carried an explicit library.
const PRE_LEDGER_VERSION = 35;

const LEGACY_GARMIN_ROW = {
  id: "b0000000-0000-4000-8000-000000000001",
  kaiordRecordId: "a0000000-0000-4000-8000-000000000001",
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: "1707805999",
  contentHash: "hash",
  exportedAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
};

const QUEUED = {
  workoutScheduleId: "555",
  workoutId: "1707805999",
  date: "2026-09-27",
  attempts: 0,
  abandoned: false,
};

const snapshotAt = (
  schemaVersion: number,
  rows: ReadonlyArray<unknown>,
  exportedAt = "2026-09-02T00:00:00.000Z"
): Snapshot => ({
  manifest: { schemaVersion, deviceId: "dev-x", exportedAt, encrypted: false },
  tables: { exportLedger: rows },
  tombstones: [],
});

describe("createDexieSnapshotPort Garmin ledger normalization", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = dbName();
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  const importAndRead = async (snapshot: Snapshot) => {
    await importSnapshot({ port: createDexieSnapshotPort(db), snapshot });
    return db.table("exportLedger").toArray();
  };

  it("should normalize a legacy row brought in by a v35 snapshot", async () => {
    // Arrange
    const snapshot = snapshotAt(PRE_LEDGER_VERSION, [LEGACY_GARMIN_ROW]);

    // Act
    const rows = await importAndRead(snapshot);

    // Assert
    expect(rows).toEqual([
      {
        ...LEGACY_GARMIN_ROW,
        library: { kind: "confirmed", workoutId: "1707805999" },
      },
    ]);
  });

  it("should normalize a legacy row inside a merged snapshot carrying the newer manifest", async () => {
    // Arrange
    const legacy = snapshotAt(PRE_LEDGER_VERSION, [LEGACY_GARMIN_ROW]);
    const current = snapshotAt(SCHEMA_HEAD, [], "2026-09-03T00:00:00.000Z");
    const merged = mergeSnapshots(current, legacy);

    // Act
    const rows = await importAndRead(merged);

    // Assert
    expect(merged.manifest.schemaVersion).toBe(SCHEMA_HEAD);
    expect(rows[0]).toHaveProperty("library", {
      kind: "confirmed",
      workoutId: "1707805999",
    });
  });

  it("should reach the same rows when the same snapshot is imported twice", async () => {
    // Arrange
    const snapshot = snapshotAt(PRE_LEDGER_VERSION, [
      { ...LEGACY_GARMIN_ROW, destinationExternalId: "garmin-unconfirmed" },
    ]);
    const once = await importAndRead(snapshot);

    // Act
    const twice = await importAndRead(snapshot);

    // Assert
    expect(twice).toStrictEqual(once);
    expect(twice[0]).toHaveProperty("library", { kind: "unconfirmed" });
  });

  it("should drop a queue entry whose schedule id is not Garmin-shaped and hold a legacy one", async () => {
    // Arrange
    const snapshot = snapshotAt(SCHEMA_HEAD, [
      {
        ...LEGACY_GARMIN_ROW,
        removalQueue: [QUEUED, { ...QUEUED, workoutScheduleId: "0" }],
      },
    ]);

    // Act
    const rows = await importAndRead(snapshot);

    // Assert
    expect(rows[0]).toHaveProperty("removalQueue", [
      { ...QUEUED, state: "held" },
    ]);
  });
});

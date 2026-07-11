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
import { decrypt, encrypt } from "../../lib/crypto";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const dbName = () => `kaiord-test-snapshot-${Date.now()}-${Math.random()}`;

const PASSPHRASE = "kaiord-spa-v1";
// Current head version KaiordDatabase opens at; v24 added the device-local
// `connections` store (excluded from the snapshot), v25 added chatConversations
// + the conversationId FK, v26 added the device-local energy-balance stores
// (`intakeEntries`, `intakePresets`, `energyTargets`), also excluded, v31 added
// the lab-analytics stores (`labReports`, `labValues`, included), and v33 dropped
// the legacy `usage` store, making `usageEvents` the synced usage source.
const SCHEMA_HEAD = 33;

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

  it("should exclude the device-local connections store from the export", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("connections").add({
      profileId: "p-1",
      providerId: "intervals",
      status: "connected",
      mechanism: "api-key",
      updatedAt: "2026-06-19T00:00:00.000Z",
    });
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.tables).not.toHaveProperty("connections");
  });

  it("should exclude the device-local energy-balance stores from the export", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("intakeEntries").add({
      id: "i-1",
      profileId: "p-1",
      date: "2026-06-21",
      loggedAt: "2026-06-21T08:00:00.000Z",
      kcal: 600,
      proteinG: 40,
      carbG: 60,
      fatG: 20,
    });
    await db.table("intakePresets").add({
      id: "pre-1",
      profileId: "p-1",
      label: "breakfast",
      kcal: 400,
      proteinG: 20,
      carbG: 50,
      fatG: 10,
      createdAt: "2026-06-21T08:00:00.000Z",
    });
    await db.table("energyTargets").add({
      profileId: "p-1",
      goalType: "fat_loss",
      startWeightKg: 80,
      targetWeightKg: 75,
      targetDate: "2026-09-01",
      createdAt: "2026-06-21T08:00:00.000Z",
      updatedAt: "2026-06-21T08:00:00.000Z",
    });
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.tables).not.toHaveProperty("intakeEntries");
    expect(snapshot.tables).not.toHaveProperty("intakePresets");
    expect(snapshot.tables).not.toHaveProperty("energyTargets");
  });

  it("should include the synced usageEvents store in the export", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("usageEvents").add({
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
    });
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.tables.usageEvents).toHaveLength(1);
  });

  it("should include the chatMessages store in the export", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("chatMessages").add({
      id: "c-1",
      profileId: "p-1",
      conversationId: "conv-1",
      role: "user",
      content: "hi",
      createdAt: "2026-06-13T10:00:00.000Z",
    });
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.tables.chatMessages).toHaveLength(1);
  });

  it("should include the chatConversations store in the export", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("chatConversations").add({
      id: "conv-1",
      profileId: "p-1",
      title: "Cycling",
      createdAt: "2026-06-13T10:00:00.000Z",
      updatedAt: "2026-06-13T10:00:00.000Z",
    });
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.tables.chatConversations).toHaveLength(1);
  });

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

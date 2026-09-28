/**
 * Export-ledger commits addressed by natural key — real (fake-indexeddb)
 * Dexie databases. A POST that resolves after the ledger row for its natural
 * key was replaced (a cloud sync imported another device's winning row) or
 * removed must still record its destination id on whatever row now holds the
 * key, re-inserting it when none does, on both the create [C] and update [U]
 * paths.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  recordExport,
  type RecordExportInput,
} from "../../application/export/record-export.use-case";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { KaiordDatabase } from "./dexie-database";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const RECORD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const T1 = new Date("2026-09-10T08:00:00.000Z");
const T2 = new Date("2026-09-10T09:00:00.000Z");
const T3 = new Date("2026-09-10T10:00:00.000Z");

const dbName = (device: string) =>
  `kaiord-test-ledger-commit-${device}-${Date.now()}-${Math.random()}`;

const exportInput = (
  payload: Record<string, unknown>,
  postFn: RecordExportInput["postFn"]
): RecordExportInput => ({
  kaiordRecordId: RECORD_ID,
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  payload,
  postFn,
});

const exportNow = (db: KaiordDatabase, payload: object, externalId: string) =>
  recordExport(
    { ledgerRepo: createDexieExportLedgerRepository(db) },
    exportInput({ ...payload }, async () => ({ externalId }))
  );

/** Start an export whose POST stays in flight until `resolvePost` is called. */
const startInFlightExport = async (db: KaiordDatabase, payload: object) => {
  let resolvePost: (externalId: string) => void = () => undefined;
  let postStarted: () => void = () => undefined;
  const started = new Promise<void>((resolve) => (postStarted = resolve));
  const done = recordExport(
    { ledgerRepo: createDexieExportLedgerRepository(db) },
    exportInput(
      { ...payload },
      () =>
        new Promise((resolve) => {
          resolvePost = (externalId) => resolve({ externalId });
          postStarted();
        })
    )
  );
  await started;
  return { done, resolvePost: (id: string) => resolvePost(id) };
};

const ledgerRows = async (db: KaiordDatabase) =>
  (await db.table("exportLedger").toArray()) as ExportLedgerEntry[];

describe("export-ledger commit by natural key", () => {
  let dbA: KaiordDatabase;
  let dbB: KaiordDatabase;
  const cloud = () =>
    createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
  const sync = (
    port: ReturnType<typeof cloud>,
    db: KaiordDatabase,
    deviceId: string
  ) =>
    syncWithCloud({
      cloud: port,
      snapshotPort: createDexieSnapshotPort(db),
      deviceId,
    });

  beforeEach(async () => {
    // Fake only `Date`: Dexie and fake-indexeddb schedule on real timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    dbA = new KaiordDatabase(dbName("a"));
    dbB = new KaiordDatabase(dbName("b"));
    await Promise.all([dbA.open(), dbB.open()]);
  });

  afterEach(async () => {
    vi.useRealTimers();
    dbA.close();
    dbB.close();
    await Promise.all([Dexie.delete(dbA.name), Dexie.delete(dbB.name)]);
  });

  it("should record the POST id on the row a mid-POST sync imported [C]", async () => {
    // Arrange
    const shared = cloud();
    vi.setSystemTime(T1);
    await exportNow(dbA, { name: "Intervals" }, "garmin-a");
    await sync(shared, dbA, "dev-a");
    vi.setSystemTime(T2);
    const inFlight = await startInFlightExport(dbB, { name: "Intervals" });
    vi.setSystemTime(T3);
    await sync(shared, dbB, "dev-b");

    // Act
    inFlight.resolvePost("garmin-b");
    const result = await inFlight.done;

    // Assert
    const rows = await ledgerRows(dbB);
    expect(rows.map((r) => r.destinationExternalId)).toEqual(["garmin-b"]);
    expect(rows[0]?.id).toBe(result.ledgerId);
    expect(result).toMatchObject({
      outcome: "created",
      externalId: "garmin-b",
    });
  });

  it("should record the POST id on the row a mid-POST sync imported [U]", async () => {
    // Arrange
    const shared = cloud();
    vi.setSystemTime(T1);
    await exportNow(dbB, { name: "Intervals" }, "garmin-b1");
    vi.setSystemTime(T2);
    await exportNow(dbA, { name: "Intervals" }, "garmin-a");
    await sync(shared, dbA, "dev-a");
    vi.setSystemTime(T3);
    const inFlight = await startInFlightExport(dbB, { name: "Tempo" });
    await sync(shared, dbB, "dev-b");

    // Act
    inFlight.resolvePost("garmin-b2");
    const result = await inFlight.done;

    // Assert
    const rows = await ledgerRows(dbB);
    expect(rows.map((r) => r.destinationExternalId)).toEqual(["garmin-b2"]);
    expect(rows[0]?.id).toBe(result.ledgerId);
    expect(result).toMatchObject({
      outcome: "updated",
      externalId: "garmin-b2",
    });
  });

  it("should re-insert the row with its ledger id when it vanished mid-POST [C]", async () => {
    // Arrange
    vi.setSystemTime(T1);
    const ledger = dbA.table("exportLedger");
    const postFn = async () => {
      await ledger.clear();
      return { externalId: "garmin-a" };
    };

    // Act
    const result = await recordExport(
      { ledgerRepo: createDexieExportLedgerRepository(dbA) },
      exportInput({ name: "Intervals" }, postFn)
    );

    // Assert
    const rows = await ledgerRows(dbA);
    expect(rows.map((r) => [r.id, r.destinationExternalId])).toEqual([
      [result.ledgerId, "garmin-a"],
    ]);
  });

  it("should re-insert the row with its ledger id when it vanished mid-POST [U]", async () => {
    // Arrange
    vi.setSystemTime(T1);
    const first = await exportNow(dbA, { name: "Intervals" }, "garmin-a1");
    const ledger = dbA.table("exportLedger");
    const postFn = async () => {
      await ledger.clear();
      return { externalId: "garmin-a2" };
    };
    vi.setSystemTime(T2);

    // Act
    const result = await recordExport(
      { ledgerRepo: createDexieExportLedgerRepository(dbA) },
      exportInput({ name: "Tempo" }, postFn)
    );

    // Assert
    const rows = await ledgerRows(dbA);
    expect(result.ledgerId).toBe(first.ledgerId);
    expect(rows.map((r) => [r.id, r.destinationExternalId])).toEqual([
      [first.ledgerId, "garmin-a2"],
    ]);
  });
});

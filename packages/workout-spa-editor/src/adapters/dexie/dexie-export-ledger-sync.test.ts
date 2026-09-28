/**
 * Cross-device export-ledger sync — two real (fake-indexeddb) Dexie
 * databases that each record an export for the same natural key
 * `[kaiordRecordId+destinationBridgeId]`, then sync through one shared
 * in-memory cloud. The merged snapshot must converge on a single ledger row
 * per natural key; otherwise the unique index rejects the import and
 * `syncWithCloud` fails permanently.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recordExport } from "../../application/export/record-export.use-case";
import {
  BODY_COMPOSITION,
  GARMIN_BRIDGE_ID,
  GARMIN_UPLOAD_EXTERNAL_ID,
  measurementRecordId,
} from "../../application/health/sync-tanita-body-composition-measurements";
import { exportSnapshot } from "../../application/sync/export-snapshot";
import { importSnapshot } from "../../application/sync/import-snapshot";
import { mergeSnapshots } from "../../application/sync/merge-snapshots";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { KaiordDatabase } from "./dexie-database";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const WORKOUT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
// Explicit write clocks so "which device wrote last" never rides on two real
// `Date.now()` reads landing in distinct milliseconds.
const B_WRITES_AT = new Date("2026-09-10T08:00:00.000Z");
const A_WRITES_AT = new Date("2026-09-10T09:00:00.000Z");
const LATE_WRITE_AT = new Date("2026-09-10T10:00:00.000Z");
const WEIGHT_ID = measurementRecordId("2026-09-01T07:00:00.000Z");

const dbName = (device: string) =>
  `kaiord-test-ledger-sync-${device}-${Date.now()}-${Math.random()}`;

const exportBoth = async (db: KaiordDatabase, externalId: string) => {
  const deps = { ledgerRepo: createDexieExportLedgerRepository(db) };
  await recordExport(deps, {
    kaiordRecordId: WORKOUT_ID,
    dataType: "workout",
    destinationBridgeId: "garmin-bridge",
    payload: { name: "Intervals" },
    postFn: async () => ({ externalId }),
  });
  await recordExport(deps, {
    kaiordRecordId: WEIGHT_ID,
    dataType: BODY_COMPOSITION,
    destinationBridgeId: GARMIN_BRIDGE_ID,
    payload: { weightKilograms: 75 },
    postFn: async () => ({ externalId: GARMIN_UPLOAD_EXTERNAL_ID }),
  });
};

const ledgerRows = async (db: KaiordDatabase) =>
  (await db.table("exportLedger").toArray()) as ExportLedgerEntry[];

const naturalKeys = (rows: ExportLedgerEntry[]) =>
  rows.map((r) => `${r.kaiordRecordId}:${r.destinationBridgeId}`).sort();

describe("export-ledger cross-device sync", () => {
  let dbA: KaiordDatabase;
  let dbB: KaiordDatabase;

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

  it("should converge on one ledger row per natural key on both devices", async () => {
    // Arrange
    await exportBoth(dbA, "garmin-a");
    await exportBoth(dbB, "garmin-b");
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const sync = (db: KaiordDatabase, deviceId: string) =>
      syncWithCloud({
        cloud,
        snapshotPort: createDexieSnapshotPort(db),
        deviceId,
      });

    // Act
    await sync(dbA, "dev-a");
    await sync(dbB, "dev-b");
    await sync(dbA, "dev-a");

    // Assert
    const expected = naturalKeys(await ledgerRows(dbB));
    expect(expected).toHaveLength(2);
    expect(new Set(expected).size).toBe(2);
    expect(naturalKeys(await ledgerRows(dbA))).toEqual(expected);
    expect(await ledgerRows(dbA)).toEqual(await ledgerRows(dbB));
  });

  it("should keep ledger writes made between export and import", async () => {
    // Arrange
    vi.setSystemTime(B_WRITES_AT);
    await exportBoth(dbB, "garmin-b");
    const remote = await exportSnapshot({
      port: createDexieSnapshotPort(dbB),
      deviceId: "dev-b",
    });
    vi.setSystemTime(A_WRITES_AT);
    await exportBoth(dbA, "garmin-a");
    const port = createDexieSnapshotPort(dbA);
    const local = await exportSnapshot({ port, deviceId: "dev-a" });
    const repo = createDexieExportLedgerRepository(dbA);
    const before = await ledgerRows(dbA);
    const [updated] = before;
    const lateUpdate = LATE_WRITE_AT.toISOString();
    vi.setSystemTime(LATE_WRITE_AT);
    await repo.mutateByKey(updated, (row) =>
      row ? { ...row, destinationExternalId: "garmin-late" } : row
    );
    const created = { ...updated, id: crypto.randomUUID() };
    await repo.insertPending({
      ...created,
      kaiordRecordId: crypto.randomUUID(),
      updatedAt: lateUpdate,
    });

    // Act
    await importSnapshot({ port, snapshot: mergeSnapshots(local, remote) });

    // Assert
    const rows = await ledgerRows(dbA);
    const ids = [...before.map((r) => r.id), created.id].sort();
    expect(rows.map((r) => r.id).sort()).toEqual(ids);
    expect(rows.find((r) => r.id === updated.id)?.destinationExternalId).toBe(
      "garmin-late"
    );
  });

  it("should drop a live ledger row the imported snapshot tombstones", async () => {
    // Arrange
    await exportBoth(dbA, "garmin-a");
    const port = createDexieSnapshotPort(dbA);
    const local = await exportSnapshot({ port, deviceId: "dev-a" });
    const [doomed] = await ledgerRows(dbA);
    const tombstone = {
      table: "exportLedger",
      id: doomed.id,
      deletedAt: "2099-01-01T00:00:00.000Z",
    };
    const snapshot = {
      ...local,
      tables: { ...local.tables, exportLedger: [] },
      tombstones: [tombstone],
    };

    // Act
    await importSnapshot({
      port,
      snapshot,
      now: () => new Date("2099-01-02T00:00:00.000Z"),
    });

    // Assert
    const ids = (await ledgerRows(dbA)).map((r) => r.id);
    expect(ids).toHaveLength(1);
    expect(ids).not.toContain(doomed.id);
  });

  it("should not resurrect a pending row rolled back after the export", async () => {
    // Arrange
    vi.setSystemTime(A_WRITES_AT);
    const repo = createDexieExportLedgerRepository(dbA);
    const pendingId = crypto.randomUUID();
    await repo.insertPending({
      id: pendingId,
      kaiordRecordId: WORKOUT_ID,
      dataType: "workout",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "pending",
      contentHash: "hash",
      exportedAt: A_WRITES_AT.toISOString(),
      updatedAt: A_WRITES_AT.toISOString(),
    });
    const port = createDexieSnapshotPort(dbA);
    const stale = await exportSnapshot({ port, deviceId: "dev-a" });
    vi.setSystemTime(LATE_WRITE_AT);
    await repo.deleteById(pendingId);
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: stale,
      revision: "rev-0",
      pushCount: 0,
    });

    // Act
    await importSnapshot({ port, snapshot: stale });
    const afterImport = await ledgerRows(dbA);
    await syncWithCloud({ cloud, snapshotPort: port, deviceId: "dev-a" });

    // Assert
    expect(afterImport).toEqual([]);
    expect(await ledgerRows(dbA)).toEqual([]);
    expect(
      await dbA.table("tombstones").get(["exportLedger", pendingId])
    ).toEqual({
      table: "exportLedger",
      id: pendingId,
      deletedAt: LATE_WRITE_AT.toISOString(),
    });
    expect(cloud.state.snapshot?.tables.exportLedger).toEqual([]);
  });
});

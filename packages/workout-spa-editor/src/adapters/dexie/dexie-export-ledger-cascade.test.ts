/**
 * Tests for export-ledger cascade (on-delete hook) and orphan sweep.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { KaiordDatabase } from "./dexie-database";
import {
  installExportLedgerCascade,
  sweepOrphanLedgerEntries,
} from "./dexie-export-ledger-cascade";

const dbName = (suffix: string) =>
  `kaiord-test-v17-cascade-${suffix}-${Date.now()}-${Math.random()}`;

const STORES = {
  healthSleep:
    "id, profileId, [profileId+date], date, sourceBridgeId, externalId, kaiordRecordId",
  workouts: "id, profileId, [profileId+date], date, kaiordRecordId",
  exportLedger:
    "id, &[kaiordRecordId+destinationBridgeId], kaiordRecordId, destinationBridgeId",
} as const;

const PROFILE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("installExportLedgerCascade + sweepOrphanLedgerEntries", () => {
  let name: string;
  let db: Dexie & Record<string, unknown>;

  beforeEach(async () => {
    name = dbName("apply");
    db = new Dexie(name) as Dexie & Record<string, unknown>;
    db.version(1).stores(STORES);
    await db.open();
    installExportLedgerCascade(db as unknown as KaiordDatabase);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it.each([
    {
      store: "healthSleep",
      date: "2026-01-01",
      dataType: "health-sleep",
      destinationExternalId: "ext-1",
      contentHash: "abc",
    },
    {
      store: "workouts",
      date: "2026-01-02",
      dataType: "workout",
      destinationExternalId: "ext-2",
      contentHash: "def",
    },
  ])(
    "should delete matching exportLedger rows when a $store record is deleted",
    async ({ store, date, dataType, destinationExternalId, contentHash }) => {
      // Arrange
      const kaiordRecordId = crypto.randomUUID();
      await db.table(store).add({
        id: kaiordRecordId,
        profileId: PROFILE_ID,
        date,
        kaiordRecordId,
      });
      await db.table("exportLedger").add({
        id: crypto.randomUUID(),
        kaiordRecordId,
        dataType,
        destinationBridgeId: "garmin-bridge",
        destinationExternalId,
        contentHash,
        exportedAt: new Date().toISOString(),
      });

      // Act
      // Delete inside a transaction that includes exportLedger so the
      // hook promise can complete within the same IDB transaction.
      await db.transaction(
        "rw",
        [db.table(store), db.table("exportLedger")],
        async () => {
          await db.table(store).delete(kaiordRecordId);
        }
      );

      // Assert
      const remaining = await db.table("exportLedger").toArray();
      expect(remaining).toHaveLength(0);
    }
  );

  it("should remove orphan ledger entries whose kaiordRecordId resolves to nothing", async () => {
    // Arrange
    const orphanId = crypto.randomUUID();
    await db.table("exportLedger").add({
      id: crypto.randomUUID(),
      kaiordRecordId: orphanId,
      dataType: "health-sleep",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "ext-3",
      contentHash: "ghi",
      exportedAt: new Date().toISOString(),
    });

    // Act
    const result = await sweepOrphanLedgerEntries(
      db as unknown as KaiordDatabase
    );

    // Assert
    expect(result.removed).toBe(1);
    expect(await db.table("exportLedger").toArray()).toHaveLength(0);
  });

  it("should not remove ledger entries whose kaiordRecordId resolves to a live record", async () => {
    // Arrange
    const kaiordRecordId = crypto.randomUUID();
    await db.table("healthSleep").add({
      id: kaiordRecordId,
      profileId: PROFILE_ID,
      date: "2026-01-03",
      kaiordRecordId,
    });
    await db.table("exportLedger").add({
      id: crypto.randomUUID(),
      kaiordRecordId,
      dataType: "health-sleep",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "ext-4",
      contentHash: "jkl",
      exportedAt: new Date().toISOString(),
    });

    // Act
    const result = await sweepOrphanLedgerEntries(
      db as unknown as KaiordDatabase
    );

    // Assert
    expect(result.removed).toBe(0);
    expect(await db.table("exportLedger").toArray()).toHaveLength(1);
  });
});

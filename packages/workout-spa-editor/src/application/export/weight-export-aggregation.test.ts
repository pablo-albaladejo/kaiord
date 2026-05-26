/**
 * AC-9 — weight-export aggregation integration test.
 *
 * Profile P has weight imports from 3 different sourceBridgeId values
 * for the same day. Pushing weight to garmin-bridge must export all 3
 * records (one POST each). Re-running must produce 3x SKIP.
 *
 * Wires real Dexie adapters to exercise the full stack end-to-end.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../../adapters/dexie/dexie-export-ledger-repository";
import { createDexieImportedRecordRepository } from "../../adapters/dexie/dexie-imported-record-repository";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import { recordExport } from "./record-export.use-case";

const dbName = () => `test-weight-export-agg-${Date.now()}-${Math.random()}`;

const PROFILE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const DATE = "2026-05-26";

describe("weight export aggregation (AC-9)", () => {
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

  it("should export all three weight rows when a profile has weight imports from three different sources for the same day", async () => {
    // Arrange
    const recordRepo = createDexieImportedRecordRepository(db);
    const ledgerRepo = createDexieExportLedgerRepository(db);
    const sources = ["garmin-bridge", "withings-bridge", "manual"] as const;
    const kaiordIds: string[] = [];
    for (const src of sources) {
      const r = await upsertImportedRecord(
        { recordRepo },
        {
          profileId: PROFILE_ID,
          dataType: "weight",
          sourceBridgeId: src,
          externalId: `${src}-weight-${DATE}`,
          date: DATE,
          payload: { weightKilograms: 75 },
          measuredAt: `${DATE}T08:00:00.000Z`,
        }
      );
      kaiordIds.push(r.kaiordRecordId);
    }
    let postCount = 0;
    const postFn = vi.fn().mockImplementation(async () => {
      postCount++;
      return { externalId: `garmin-ext-${postCount}` };
    });

    // Act
    const results = await Promise.all(
      kaiordIds.map((kaiordRecordId) =>
        recordExport(
          { ledgerRepo },
          {
            kaiordRecordId,
            dataType: "weight",
            destinationBridgeId: "garmin-bridge",
            payload: { weightKilograms: 75 },
            postFn,
          }
        )
      )
    );

    // Assert
    expect(postFn).toHaveBeenCalledTimes(sources.length);
    const ledgerRows = await db.table("exportLedger").toArray();
    expect(ledgerRows).toHaveLength(sources.length);
    expect(results.map((r) => r.outcome)).toEqual([
      "created",
      "created",
      "created",
    ]);
  });

  it("should be a 3x SKIP when re-running export on the same day", async () => {
    // Arrange
    const recordRepo = createDexieImportedRecordRepository(db);
    const ledgerRepo = createDexieExportLedgerRepository(db);
    const sources = ["garmin-bridge", "withings-bridge", "manual"] as const;
    const kaiordIds: string[] = [];
    for (const src of sources) {
      const r = await upsertImportedRecord(
        { recordRepo },
        {
          profileId: PROFILE_ID,
          dataType: "weight",
          sourceBridgeId: src,
          externalId: `${src}-weight-${DATE}`,
          date: DATE,
          payload: { weightKilograms: 75 },
          measuredAt: `${DATE}T08:00:00.000Z`,
        }
      );
      kaiordIds.push(r.kaiordRecordId);
    }
    let postCount = 0;
    const postFn = vi.fn().mockImplementation(async () => {
      postCount++;
      return { externalId: `garmin-ext-${postCount}` };
    });
    for (const kaiordRecordId of kaiordIds) {
      await recordExport(
        { ledgerRepo },
        {
          kaiordRecordId,
          dataType: "weight",
          destinationBridgeId: "garmin-bridge",
          payload: { weightKilograms: 75 },
          postFn,
        }
      );
    }
    postFn.mockClear();

    // Act
    const rerunResults = await Promise.all(
      kaiordIds.map((kaiordRecordId) =>
        recordExport(
          { ledgerRepo },
          {
            kaiordRecordId,
            dataType: "weight",
            destinationBridgeId: "garmin-bridge",
            payload: { weightKilograms: 75 },
            postFn,
          }
        )
      )
    );

    // Assert
    expect(postFn).not.toHaveBeenCalled();
    const ledgerRows = await db.table("exportLedger").toArray();
    expect(ledgerRows).toHaveLength(sources.length);
    expect(rerunResults.map((r) => r.outcome)).toEqual([
      "skipped",
      "skipped",
      "skipped",
    ]);
  });
});

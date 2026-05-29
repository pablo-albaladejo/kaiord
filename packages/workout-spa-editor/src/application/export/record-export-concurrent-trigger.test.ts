/**
 * AC-8 load-bearing concurrent-trigger test.
 *
 * Two parallel invocations of recordExport targeting the same
 * (kaiordRecordId, destinationBridgeId) must result in exactly one
 * POST call and exactly one exportLedger row.
 *
 * Wires the real Dexie adapter — the unique index constraint is what
 * closes the race; this test must use a real IDB to exercise it.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../../adapters/dexie/dexie-export-ledger-repository";
import { recordExport } from "./record-export.use-case";

const dbName = () =>
  `test-record-export-concurrent-${Date.now()}-${Math.random()}`;

const KAIO_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DEST_BRIDGE = "garmin-bridge";
const PAYLOAD = { weightKilograms: 75 };

describe("recordExport — concurrent trigger", () => {
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

  it("should fire postFn exactly once when two parallel invocations target the same (kaiordRecordId, destinationBridgeId)", async () => {
    // Arrange
    let postCallCount = 0;
    const postFn = vi.fn().mockImplementation(async () => {
      postCallCount++;
      return { externalId: `ext-${postCallCount}` };
    });
    const ledgerRepo = createDexieExportLedgerRepository(db);
    const deps = { ledgerRepo };
    const input = {
      kaiordRecordId: KAIO_ID,
      dataType: "weight" as const,
      destinationBridgeId: DEST_BRIDGE,
      payload: PAYLOAD,
      postFn,
    };

    // Act
    const results = await Promise.all([
      recordExport(deps, input),
      recordExport(deps, input),
    ]);

    // Assert
    expect(postFn).toHaveBeenCalledTimes(1);
    const ledgerRows = await db.table("exportLedger").toArray();
    expect(ledgerRows).toHaveLength(1);
    const outcomes = results.map((r) => r.outcome);
    expect(outcomes).toContain("created");
    expect(
      outcomes.filter(
        (o) => o === "created" || o === "lost-race" || o === "skipped"
      )
    ).toHaveLength(2);
  });
});

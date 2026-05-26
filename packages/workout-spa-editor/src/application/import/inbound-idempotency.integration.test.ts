/**
 * AC-7 acceptance criterion integration test:
 * "zero new rows when the same Garmin weight import runs twice"
 *
 * Wires the real Dexie adapter to exercise the full stack.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexieImportedRecordRepository } from "../../adapters/dexie/dexie-imported-record-repository";
import { upsertImportedRecord } from "./upsert-imported-record.use-case";

const dbName = () => `test-inbound-idempotency-${Date.now()}-${Math.random()}`;

describe("inbound idempotency — Garmin weight import", () => {
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

  it("should produce zero new rows when the same Garmin weight import runs twice", async () => {
    // Arrange
    const recordRepo = createDexieImportedRecordRepository(db);
    const deps = { recordRepo };
    const importInput = {
      profileId: "11111111-1111-4111-8111-111111111111",
      dataType: "weight" as const,
      sourceBridgeId: "garmin-bridge",
      externalId: "garmin-weight-2026-05-26-001",
      date: "2026-05-26",
      payload: { weightKilograms: 75.5 },
      measuredAt: "2026-05-26T07:30:00.000Z",
    };
    await upsertImportedRecord(deps, importInput);
    const countAfterFirst = await db.table("healthWeight").count();

    // Act
    await upsertImportedRecord(deps, importInput);
    const countAfterSecond = await db.table("healthWeight").count();

    // Assert
    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(1);
  });
});

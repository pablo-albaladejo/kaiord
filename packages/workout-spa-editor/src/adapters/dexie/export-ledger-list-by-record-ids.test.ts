import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ExportLedgerRepository } from "../../application/export/export-ledger-repository.port";
import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";

const row = (
  kaiordRecordId: string,
  destinationBridgeId = "garmin-bridge"
): ExportLedgerEntry => ({
  id: `${kaiordRecordId}-${destinationBridgeId}`,
  kaiordRecordId,
  destinationBridgeId,
  dataType: "workout",
  destinationExternalId: "1",
  contentHash: "h",
  exportedAt: "2026-10-01T08:00:00.000Z",
});

const db = sharedKaiordDatabase("ledger-list-by-record-ids");

const adapters: Array<[string, () => ExportLedgerRepository]> = [
  ["dexie", () => createDexieExportLedgerRepository(db)],
  ["in-memory", () => createInMemoryExportLedgerRepository()],
];

describe.each(adapters)("listByRecordIds (%s)", (_, make) => {
  let repo: ExportLedgerRepository;

  beforeEach(async () => {
    await db.open();
    repo = make();
    for (const r of [row("w1"), row("w2"), row("w3"), row("w1", "other")])
      await repo.insertPending(r);
  });

  afterEach(async () => {
    await db.table("exportLedger").clear();
  });

  it("should return the rows of the listed records for one bridge", async () => {
    // Arrange
    const input = {
      kaiordRecordIds: ["w1", "w3", "missing"],
      destinationBridgeId: "garmin-bridge",
    };

    // Act
    const rows = await repo.listByRecordIds(input);

    // Assert
    expect(rows.map((r) => r.id).sort()).toEqual([
      "w1-garmin-bridge",
      "w3-garmin-bridge",
    ]);
  });

  it("should return nothing for an empty id list", async () => {
    // Arrange
    const input = { kaiordRecordIds: [], destinationBridgeId: "garmin-bridge" };

    // Act
    const rows = await repo.listByRecordIds(input);

    // Assert
    expect(rows).toEqual([]);
  });
});

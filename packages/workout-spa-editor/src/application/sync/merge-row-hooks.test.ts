import { describe, expect, it } from "vitest";

import { mergeExportLedgerRows } from "./merge-export-ledger-rows";
import { mergeRow, ROW_MERGE_HOOKS, rowMergeKey } from "./merge-row-hooks";

const ledgerRow = (overrides: Record<string, unknown> = {}) => ({
  id: "id-b",
  kaiordRecordId: "rec-1",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: "ext-1",
  exportedAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

const LATER = "2026-09-02T00:00:00.000Z";

describe("ROW_MERGE_HOOKS registry", () => {
  it("should key exportLedger rows by their natural key, not their id", () => {
    // Arrange
    const a = ledgerRow({ id: "id-a" });
    const b = ledgerRow({ id: "id-b" });

    // Act
    const keys = [
      rowMergeKey("exportLedger", a),
      rowMergeKey("exportLedger", b),
    ];

    // Assert
    expect(keys).toEqual([
      "rec-1\u0000garmin-bridge",
      "rec-1\u0000garmin-bridge",
    ]);
    expect(ROW_MERGE_HOOKS.exportLedger.merge(a, b)).toBe(
      mergeExportLedgerRows(a, b)
    );
  });

  it("should key and merge unhooked tables by primary key and clock", () => {
    // Arrange
    const older = { id: "w-1", updatedAt: "2026-09-01T00:00:00.000Z" };
    const newer = { id: "w-1", updatedAt: LATER };

    // Act
    const key = rowMergeKey("workouts", older);
    const winner = mergeRow("workouts", older, newer);

    // Assert
    expect(key).toBe("w-1");
    expect(winner).toBe(newer);
  });
});

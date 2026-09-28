import { describe, expect, it } from "vitest";

import { mergeExportLedgerRows } from "./merge-export-ledger-rows";
import { rowClock } from "./merge-row-hooks";

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

describe("mergeExportLedgerRows", () => {
  it("should keep the row with the newer updatedAt", () => {
    // Arrange
    const older = ledgerRow({ id: "id-a" });
    const newer = ledgerRow({ updatedAt: LATER });

    // Act
    const winners = [
      mergeExportLedgerRows(older, newer),
      mergeExportLedgerRows(newer, older),
    ];

    // Assert
    expect(winners).toEqual([newer, newer]);
  });

  it("should fall back to exportedAt when updatedAt is absent", () => {
    // Arrange
    const legacy = ledgerRow({ id: "id-a", updatedAt: undefined });
    const stamped = ledgerRow({ exportedAt: LATER, updatedAt: undefined });

    // Act
    const winner = mergeExportLedgerRows(legacy, stamped);

    // Assert
    expect(winner).toBe(stamped);
  });

  it("should prefer a committed row over a NEWER pending one", () => {
    // Arrange
    const pending = ledgerRow({
      id: "id-a",
      destinationExternalId: "pending",
      updatedAt: LATER,
    });
    const committed = ledgerRow();

    // Act
    const winners = [
      mergeExportLedgerRows(pending, committed),
      mergeExportLedgerRows(committed, pending),
    ];

    // Assert
    expect(winners).toEqual([committed, committed]);
  });

  it("should read the clock as the later of updatedAt and exportedAt", () => {
    // Arrange
    const EARLIER = "2026-08-31T00:00:00.000Z";
    const staleStamp = ledgerRow({
      id: "id-a",
      updatedAt: EARLIER,
      exportedAt: LATER,
    });
    const bumpedStamp = ledgerRow({ updatedAt: LATER, exportedAt: EARLIER });
    const plain = ledgerRow({ id: "id-c" });

    // Act
    const winners = [
      mergeExportLedgerRows(staleStamp, plain),
      mergeExportLedgerRows(bumpedStamp, plain),
      mergeExportLedgerRows(staleStamp, bumpedStamp),
    ];

    // Assert
    expect(winners).toEqual([staleStamp, bumpedStamp, staleStamp]);
    expect(rowClock("exportLedger", staleStamp)).toBe(Date.parse(LATER));
  });

  it("should prefer the lexicographically smaller id on a full tie", () => {
    // Arrange
    const a = ledgerRow({ id: "id-a", destinationExternalId: "ext-a" });
    const b = ledgerRow({ id: "id-b", destinationExternalId: "ext-b" });

    // Act
    const winners = [mergeExportLedgerRows(a, b), mergeExportLedgerRows(b, a)];

    // Assert
    expect(winners).toEqual([a, a]);
  });

  it("should be symmetric across every tie-break level", () => {
    // Arrange
    const rows = [
      ledgerRow({ id: "id-a" }),
      ledgerRow({ id: "id-c", updatedAt: LATER }),
      ledgerRow({ id: "id-0", destinationExternalId: "pending" }),
      ledgerRow({
        id: "id-e",
        destinationExternalId: "pending",
        updatedAt: LATER,
      }),
      ledgerRow({ id: "id-b", contentHash: "x" }),
      ledgerRow({ id: "id-b", contentHash: "y" }),
      ledgerRow({ id: "id-d", updatedAt: undefined }),
    ];

    // Act
    const pairs = rows.flatMap((a) =>
      rows.map((b) => [
        mergeExportLedgerRows(a, b),
        mergeExportLedgerRows(b, a),
      ])
    );

    // Assert
    for (const [ab, ba] of pairs) expect(ab).toStrictEqual(ba);
  });
});

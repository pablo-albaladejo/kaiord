import { describe, expect, it } from "vitest";

import type { Tombstone } from "../../types/snapshot";
import { createLiveRowMerge, mergeTableRows } from "./merge-table-rows";
import { tombstoneClocks } from "./merge-tombstones";

const ledgerRow = (id: string, kaiordRecordId: string, updatedAt: string) => ({
  id,
  kaiordRecordId,
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: `ext-${id}`,
  exportedAt: updatedAt,
  updatedAt,
});

const T1 = "2026-09-01T00:00:00.000Z";
const T2 = "2026-09-02T00:00:00.000Z";
const T3 = "2026-09-03T00:00:00.000Z";

const liveMergeLedger = (tombstones: Tombstone[] = []) => {
  const merge = createLiveRowMerge(tombstones)("exportLedger");
  if (!merge) throw new Error("exportLedger must have a live merge");
  return merge;
};

describe("createLiveRowMerge", () => {
  it("should keep a live row absent from the incoming snapshot", () => {
    // Arrange
    const live = [ledgerRow("l-1", "rec-live", T2)];
    const incoming = [ledgerRow("i-1", "rec-in", T1)];

    // Act
    const merged = liveMergeLedger()(live, incoming) as Array<{ id: string }>;

    // Assert
    expect(merged.map((r) => r.id).sort()).toEqual(["i-1", "l-1"]);
  });

  it("should drop a live row the tombstones delete", () => {
    // Arrange
    const live = [ledgerRow("l-1", "rec-live", T1)];
    const tombstones = [{ table: "exportLedger", id: "l-1", deletedAt: T2 }];

    // Act
    const merged = liveMergeLedger(tombstones)(live, []);

    // Assert
    expect(merged).toEqual([]);
  });

  it("should collapse live and incoming rows sharing a natural key", () => {
    // Arrange
    const live = [ledgerRow("l-1", "rec-1", T3)];
    const incoming = [ledgerRow("i-1", "rec-1", T2)];

    // Act
    const merged = liveMergeLedger()(live, incoming);

    // Assert
    expect(merged).toEqual(live);
  });

  it("should let a live row win its natural key when the rival is tombstoned", () => {
    // Arrange
    const live = [ledgerRow("l-1", "rec-1", T1)];
    const incoming = [ledgerRow("i-1", "rec-1", T2)];
    const tombstones = [{ table: "exportLedger", id: "i-1", deletedAt: T3 }];

    // Act
    const merged = liveMergeLedger(tombstones)(live, incoming);

    // Assert
    expect(merged).toEqual(live);
  });

  it("should replace wholesale tables without a hook, including prototype names", () => {
    // Arrange
    const liveMerge = createLiveRowMerge([]);

    // Act
    const merges = ["workouts", "toString"].map(liveMerge);

    // Assert
    expect(merges).toEqual([undefined, undefined]);
  });
});

describe("mergeTableRows", () => {
  it("should suppress against the hook clock, the later of updatedAt and exportedAt", () => {
    // Arrange
    const reExported = { ...ledgerRow("l-1", "rec-1", T1), exportedAt: T3 };
    const deletes = tombstoneClocks([
      { table: "exportLedger", id: "l-1", deletedAt: T2 },
    ]);

    // Act
    const merged = mergeTableRows("exportLedger", [reExported], deletes);

    // Assert
    expect(merged).toEqual([reExported]);
  });
});

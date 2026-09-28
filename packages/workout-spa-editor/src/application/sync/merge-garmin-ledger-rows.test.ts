/**
 * AC-15 — mergeGarminLedgerRows: supersession beats the clock, and the merge
 * is symmetric.
 */
import { describe, expect, it } from "vitest";

import { mergeGarminLedgerRows } from "./merge-garmin-ledger-rows";
import { ROW_MERGE_HOOKS } from "./merge-row-hooks";

type Row = Record<string, unknown>;

const OLDER_AT = "2026-09-27T08:00:00.000Z";
const NEWER_AT = "2026-09-28T08:00:00.000Z";
const W = "1707805999";
const D1 = "2026-09-29";
const D2 = "2026-09-30";

const scheduled = (id: string, date: string) => ({
  kind: "scheduled",
  workoutScheduleId: id,
  workoutId: W,
  date,
});
const queued = (id: string, date: string, attempts = 0, abandoned = false) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts,
  abandoned,
});

const row = (id: string, updatedAt: string, garmin: Row = {}): Row => ({
  id,
  kaiordRecordId: "a0000000-0000-4000-8000-000000000001",
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: W,
  contentHash: "hash",
  exportedAt: OLDER_AT,
  updatedAt,
  library: { kind: "confirmed", workoutId: W },
  ...garmin,
});

/** Both argument orders, asserted equal: the hook contract is symmetric. */
const mergeBothWays = (a: Row, b: Row) => {
  const ab = mergeGarminLedgerRows(a, b);
  expect(mergeGarminLedgerRows(b, a)).toStrictEqual(ab);
  return ab;
};

const drain = (calendar: Map<string, string>, merged: Row) => {
  for (const e of (merged.removalQueue as { workoutScheduleId: string }[]) ??
    [])
    calendar.delete(e.workoutScheduleId);
  return [...calendar.values()];
};

describe("mergeGarminLedgerRows", () => {
  it("should keep the unqueued Placed and leave one calendar entry in the review-3 D repro", () => {
    // Arrange
    const deviceA = row("id-a", OLDER_AT, {
      placement: scheduled("2", D2),
      removalQueue: [queued("1", D1)],
    });
    const deviceB = row("id-b", NEWER_AT, { placement: scheduled("1", D1) });
    const calendar = new Map([
      ["1", D1],
      ["2", D2],
    ]);

    // Act
    const merged = mergeBothWays(deviceA, deviceB);

    // Assert
    expect(merged.placement).toEqual(scheduled("2", D2));
    expect(merged.removalQueue).toEqual([queued("1", D1)]);
    expect(drain(calendar, merged)).toEqual([D2]);
  });

  it("should queue the older of two unqueued Placed entries", () => {
    // Arrange
    const older = row("id-a", OLDER_AT, { placement: scheduled("1", D1) });
    const newer = row("id-b", NEWER_AT, { placement: scheduled("2", D2) });

    // Act
    const merged = mergeBothWays(older, newer);

    // Assert
    expect(merged.placement).toEqual(scheduled("2", D2));
    expect(merged.removalQueue).toEqual([queued("1", D1)]);
  });

  it("should let a Placed beat a newer attempting", () => {
    // Arrange
    const placed = row("id-a", OLDER_AT, { placement: scheduled("1", D1) });
    const attempting = row("id-b", NEWER_AT, {
      placement: {
        kind: "attempting",
        workoutId: W,
        date: D2,
        at: NEWER_AT,
        posted: true,
      },
    });

    // Act
    const merged = mergeBothWays(placed, attempting);

    // Assert
    expect(merged.placement).toEqual(scheduled("1", D1));
  });

  it("should never queue the merged Placed or the merged previous", () => {
    // Arrange
    const attempting = row("id-a", OLDER_AT, {
      placement: {
        kind: "attempting",
        workoutId: W,
        date: D2,
        at: OLDER_AT,
        posted: true,
        previous: scheduled("1", D1),
      },
      removalQueue: [queued("1", D1), queued("3", D1)],
    });
    const inFlight = row("id-b", NEWER_AT, {
      placement: {
        kind: "attempting",
        workoutId: W,
        date: D2,
        at: NEWER_AT,
        posted: false,
      },
      removalQueue: [queued("3", D1, 2, true)],
    });

    // Act
    const merged = mergeBothWays(attempting, inFlight);

    // Assert
    expect(merged.placement).toMatchObject({
      kind: "attempting",
      posted: true,
    });
    expect(merged.removalQueue).toEqual([queued("3", D1, 2, true)]);
  });

  it("should take library and forceRepush only from the newer row", () => {
    // Arrange
    const older = row("id-a", OLDER_AT, { forceRepush: true });
    const newer = row("id-b", NEWER_AT, { library: { kind: "unconfirmed" } });

    // Act
    const merged = mergeBothWays(older, newer);

    // Assert
    expect(merged.library).toEqual({ kind: "unconfirmed" });
    expect(merged).not.toHaveProperty("forceRepush");
    expect(merged.updatedAt).toBe(NEWER_AT);
  });

  it("should merge to uncertain when every Placed is queued, deleting neither", () => {
    // Arrange
    const deviceA = row("id-a", OLDER_AT, {
      placement: scheduled("2", D2),
      removalQueue: [queued("1", D1)],
    });
    const deviceB = row("id-b", NEWER_AT, {
      placement: scheduled("1", D1),
      removalQueue: [queued("2", D2)],
    });

    // Act
    const merged = mergeBothWays(deviceA, deviceB);

    // Assert
    expect(merged.placement).toEqual({
      kind: "uncertain",
      workoutId: W,
      date: D1,
    });
    expect(merged.removalQueue).toEqual([]);
  });

  it("should keep the scheduled side when both rows hold the same entry", () => {
    // Arrange
    const known = row("id-a", OLDER_AT, { placement: scheduled("1", D1) });
    const adopted = row("id-b", NEWER_AT, {
      placement: { kind: "unconfirmed", workoutId: W, date: D1 },
    });

    // Act
    const merged = mergeBothWays(known, adopted);

    // Assert
    expect(merged.placement).toEqual(scheduled("1", D1));
    expect(merged).not.toHaveProperty("removalQueue");
  });

  it("should let a committed row beat a newer pending one whole", () => {
    // Arrange
    const committed = row("id-a", OLDER_AT, { placement: scheduled("1", D1) });
    const pending = row("id-b", NEWER_AT, { destinationExternalId: "pending" });

    // Act
    const merged = mergeBothWays(committed, pending);

    // Assert
    expect(merged).toBe(committed);
  });

  it("should route Garmin workout rows through the exportLedger hook", () => {
    // Arrange
    const older = row("id-a", OLDER_AT, { placement: scheduled("1", D1) });
    const newer = row("id-b", NEWER_AT, { placement: scheduled("2", D2) });

    // Act
    const merged = ROW_MERGE_HOOKS.exportLedger?.merge(older, newer);

    // Assert
    expect(merged).toStrictEqual(mergeGarminLedgerRows(older, newer));
    expect(merged?.removalQueue).toEqual([queued("1", D1)]);
  });
});

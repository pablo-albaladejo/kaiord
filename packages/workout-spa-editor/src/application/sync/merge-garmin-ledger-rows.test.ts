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
type State = "held" | "keep" | "retire" | "gone";
const entry = (
  id: string,
  date: string,
  state: State,
  attempts = 0,
  abandoned = false
) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts,
  abandoned,
  state,
});
const unconfirmed = (date: string) => ({
  kind: "unconfirmed",
  workoutId: W,
  date,
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

type Queued = { workoutScheduleId: string; state: State };

/** What the drain would unschedule: every `retire` id. */
const drain = (calendar: Map<string, string>, merged: Row) => {
  for (const e of (merged.removalQueue as Queued[] | undefined) ?? [])
    if (e.state === "retire") calendar.delete(e.workoutScheduleId);
  return [...calendar.values()].sort();
};

describe("mergeGarminLedgerRows", () => {
  it("should keep the live Placed and leave one calendar entry in the review-3 D repro", () => {
    // Arrange
    const deviceA = row("id-a", OLDER_AT, {
      placement: scheduled("2", D2),
      removalQueue: [entry("1", D1, "retire"), entry("2", D2, "keep")],
    });
    const deviceB = row("id-b", NEWER_AT, {
      placement: scheduled("1", D1),
      removalQueue: [entry("1", D1, "keep")],
    });
    const calendar = new Map([
      ["1", D1],
      ["2", D2],
    ]);

    // Act
    const merged = mergeBothWays(deviceA, deviceB);

    // Assert
    expect(merged.placement).toEqual(scheduled("2", D2));
    expect(merged.removalQueue).toEqual([
      entry("1", D1, "retire"),
      entry("2", D2, "keep"),
    ]);
    expect(drain(calendar, merged)).toEqual([D2]);
  });

  it("should retire the older of two live Placed entries", () => {
    // Arrange
    const older = row("id-a", OLDER_AT, {
      placement: scheduled("1", D1),
      removalQueue: [entry("1", D1, "keep")],
    });
    const newer = row("id-b", NEWER_AT, {
      placement: scheduled("2", D2),
      removalQueue: [entry("2", D2, "keep")],
    });

    // Act
    const merged = mergeBothWays(older, newer);

    // Assert
    expect(merged.placement).toEqual(scheduled("2", D2));
    expect(merged.removalQueue).toEqual([
      entry("1", D1, "retire"),
      entry("2", D2, "keep"),
    ]);
  });

  it("should write the merged Placed keep when a row does not carry it", () => {
    // Arrange
    const bare = row("id-a", OLDER_AT, { placement: scheduled("1", D1) });

    // Act
    const merged = mergeBothWays(bare, bare);

    // Assert
    expect(merged.removalQueue).toEqual([entry("1", D1, "keep")]);
  });

  it("should let a Placed beat a newer attempting", () => {
    // Arrange
    const placed = row("id-a", OLDER_AT, {
      placement: scheduled("1", D1),
      removalQueue: [entry("1", D1, "keep")],
    });
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

  it("should never lower a state nor remove an entry", () => {
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
      removalQueue: [entry("1", D1, "keep"), entry("3", D1, "retire", 1)],
    });
    const inFlight = row("id-b", NEWER_AT, {
      placement: {
        kind: "attempting",
        workoutId: W,
        date: D2,
        at: NEWER_AT,
        posted: false,
      },
      removalQueue: [entry("3", D1, "gone", 0, true)],
    });

    // Act
    const merged = mergeBothWays(attempting, inFlight);

    // Assert
    expect(merged.placement).toMatchObject({
      kind: "attempting",
      posted: true,
    });
    expect(merged.removalQueue).toEqual([
      entry("1", D1, "keep"),
      entry("3", D1, "gone", 1, true),
    ]);
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

  it("should keep the uncertain and drain nothing when a stale Placed is gone elsewhere", () => {
    // Arrange
    const stale = row("id-a", NEWER_AT, {
      placement: scheduled("100", D2),
      removalQueue: [entry("100", D2, "keep")],
    });
    const cloud = row("id-b", OLDER_AT, {
      placement: { kind: "uncertain", workoutId: W, date: D2 },
      removalQueue: [
        entry("1", D1, "held"),
        entry("2", D1, "held"),
        entry("100", D2, "gone"),
      ],
    });
    const calendar = new Map([
      ["1", D1],
      ["2", D1],
    ]);

    // Act
    const merged = mergeBothWays(stale, cloud);

    // Assert
    expect(merged.placement).toEqual(cloud.placement);
    expect(merged.removalQueue).toEqual(cloud.removalQueue);
    expect(drain(calendar, merged)).toEqual([D1, D1]);
  });

  it("should keep an in-flight state over a tainted Placed and absorb a re-merge", () => {
    // Arrange
    const stale = row("id-a", OLDER_AT, {
      placement: scheduled("100", D1),
      removalQueue: [entry("100", D1, "keep")],
    });
    const moving = row("id-b", NEWER_AT, {
      placement: {
        kind: "uncertain",
        workoutId: W,
        date: D1,
        previous: scheduled("102", D2),
      },
      removalQueue: [entry("100", D1, "retire"), entry("102", D2, "keep")],
    });

    // Act
    const merged = mergeBothWays(stale, moving);

    // Assert
    expect(merged.placement).toEqual(moving.placement);
    expect(mergeGarminLedgerRows(merged, moving)).toStrictEqual(merged);
    expect(mergeGarminLedgerRows(stale, merged)).toStrictEqual(merged);
  });

  it("should target the maximum of all entries when none is held", () => {
    // Arrange
    const stale = row("id-a", NEWER_AT, {
      placement: scheduled("1", D1),
      removalQueue: [entry("1", D1, "keep")],
    });
    const drained = row("id-b", OLDER_AT, {
      removalQueue: [entry("1", D1, "gone"), entry("2", D2, "retire")],
    });

    // Act
    const merged = mergeBothWays(stale, drained);

    // Assert
    expect(merged.placement).toEqual({
      kind: "uncertain",
      workoutId: W,
      date: D2,
    });
  });

  it("should not let an unconfirmed Placed that may be a held entry win", () => {
    // Arrange
    const adopted = row("id-a", NEWER_AT, { placement: unconfirmed(D1) });
    const legacy = row("id-b", OLDER_AT, {
      removalQueue: [entry("1", D1, "held")],
    });

    // Act
    const merged = mergeBothWays(adopted, legacy);

    // Assert
    expect(merged.placement).toEqual({
      kind: "uncertain",
      workoutId: W,
      date: D1,
    });
    expect(merged.removalQueue).toEqual([entry("1", D1, "held")]);
  });

  it("should not let an unconfirmed Placed that may be a drained entry win", () => {
    // Arrange
    const stale = row("id-a", NEWER_AT, { placement: unconfirmed(D1) });
    const cloud = row("id-b", OLDER_AT, {
      placement: scheduled("3", D2),
      removalQueue: [entry("1", D1, "gone"), entry("3", D2, "keep")],
    });

    // Act
    const merged = mergeBothWays(stale, cloud);

    // Assert
    expect(merged.placement).toEqual(scheduled("3", D2));
    expect(merged.removalQueue).toEqual(cloud.removalQueue);
  });

  it("should let an unconfirmed Placed that matches only a keep entry win", () => {
    // Arrange
    const adopted = row("id-a", NEWER_AT, { placement: unconfirmed(D1) });
    const attempting = row("id-b", OLDER_AT, {
      placement: {
        kind: "attempting",
        workoutId: W,
        date: D2,
        at: OLDER_AT,
        posted: false,
        previous: scheduled("1", D1),
      },
      removalQueue: [entry("1", D1, "keep")],
    });

    // Act
    const merged = mergeBothWays(adopted, attempting);

    // Assert
    expect(merged.placement).toEqual(unconfirmed(D1));
    expect(merged.removalQueue).toEqual([entry("1", D1, "keep")]);
  });

  it("should let a live Placed beat an unconfirmed one that matches a retired entry", () => {
    // Arrange
    const adopted = row("id-a", NEWER_AT, { placement: unconfirmed(D1) });
    const moved = row("id-b", OLDER_AT, {
      placement: scheduled("2", D2),
      removalQueue: [entry("1", D1, "retire"), entry("2", D2, "keep")],
    });

    // Act
    const merged = mergeBothWays(adopted, moved);

    // Assert
    expect(merged.placement).toEqual(scheduled("2", D2));
    expect(merged.removalQueue).toEqual(moved.removalQueue);
  });

  it.each([
    [
      "an equal instant spelled differently",
      "2026-09-28T08:00:00Z",
      "2026-09-28T08:00:00.000Z",
    ],
    ["an unparsable stamp", "garbage", "2026-09-28T08:00:00.000Z"],
    ["two unparsable stamps", "garbage", "rubbish"],
  ])("should join updatedAt symmetrically for %s", (_label, x, y) => {
    // Arrange
    const a = row("id-a", x);
    const b = row("id-a", y);

    // Act
    const merged = mergeBothWays(a, b);

    // Assert
    expect([x, y]).toContain(merged.updatedAt);
  });

  it("should keep the scheduled side when both rows hold the same entry", () => {
    // Arrange
    const known = row("id-a", OLDER_AT, {
      placement: scheduled("1", D1),
      removalQueue: [entry("1", D1, "keep")],
    });
    const adopted = row("id-b", NEWER_AT, { placement: unconfirmed(D1) });

    // Act
    const merged = mergeBothWays(known, adopted);

    // Assert
    expect(merged.placement).toEqual(scheduled("1", D1));
    expect(merged.removalQueue).toEqual([entry("1", D1, "keep")]);
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
    expect(merged?.removalQueue).toEqual([
      entry("1", D1, "retire"),
      entry("2", D2, "keep"),
    ]);
  });
});

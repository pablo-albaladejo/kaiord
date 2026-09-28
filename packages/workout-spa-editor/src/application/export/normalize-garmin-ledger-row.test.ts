import { describe, expect, it } from "vitest";

import { normalizeGarminLedgerRow } from "./normalize-garmin-ledger-row";

const garminRow = (overrides: Record<string, unknown> = {}) => ({
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  kaiordRecordId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: "1707805999",
  contentHash: "hash",
  exportedAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  ...overrides,
});

const QUEUED = {
  workoutScheduleId: "555",
  workoutId: "1707805999",
  date: "2026-09-27",
  attempts: 1,
  abandoned: false,
};

describe("normalizeGarminLedgerRow", () => {
  it("should confirm the library from a Garmin-shaped external id", () => {
    // Arrange
    const row = garminRow();

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.library).toEqual({
      kind: "confirmed",
      workoutId: "1707805999",
    });
  });

  it.each(["pending", "garmin-unconfirmed", "garmin-1716000000000"])(
    "should mark the library unconfirmed for the legacy external id %s",
    (destinationExternalId) => {
      // Arrange
      const row = garminRow({ destinationExternalId });

      // Act
      const next = normalizeGarminLedgerRow(row);

      // Assert
      expect(next.library).toEqual({ kind: "unconfirmed" });
    }
  );

  it("should keep an existing valid library rather than re-deriving it", () => {
    // Arrange
    const library = { kind: "missing", workoutId: "1000000001" };
    const row = garminRow({ library });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.library).toEqual(library);
  });

  it("should drop an invalid queue entry and keep the valid ones", () => {
    // Arrange
    const retired = { ...QUEUED, state: "retire" };
    const row = garminRow({
      removalQueue: [
        retired,
        { ...retired, workoutScheduleId: "stub-garmin-id" },
        { ...retired, workoutScheduleId: "556", state: "normal" },
      ],
    });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.removalQueue).toEqual([retired]);
  });

  it("should hold a legacy queue entry that carries no state", () => {
    // Arrange
    const row = garminRow({ removalQueue: [{ ...QUEUED, held: true }] });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.removalQueue).toEqual([{ ...QUEUED, state: "held" }]);
  });

  it.each([
    ["a legacy placement with no list", undefined, []],
    ["an unsorted list with a repeat", ["20", "3", "20"], ["3", "20"]],
  ])(
    "should store a canonical supersedes for %s",
    (_label, supersedes, expected) => {
      // Arrange
      const placement = {
        kind: "unconfirmed",
        workoutId: "1707805999",
        date: "2026-09-27",
        ...(supersedes ? { supersedes } : {}),
      };
      const row = garminRow({ placement });

      // Act
      const next = normalizeGarminLedgerRow(row);

      // Assert
      expect(next.placement).toEqual({ ...placement, supersedes: expected });
      expect(normalizeGarminLedgerRow(next)).toEqual(next);
    }
  );

  it("should store a canonical supersedes on an attempting claim", () => {
    // Arrange
    const placement = {
      kind: "attempting",
      workoutId: "1707805999",
      date: "2026-09-27",
      at: "2026-09-26T08:00:00.000Z",
      posted: true,
    };
    const claimed = garminRow({
      placement: { ...placement, supersedes: ["9", "10", "9"] },
    });

    // Act
    const legacy = normalizeGarminLedgerRow(garminRow({ placement }));
    const next = normalizeGarminLedgerRow(claimed);

    // Assert
    expect(legacy.placement).toEqual({ ...placement, supersedes: [] });
    expect(next.placement).toEqual({ ...placement, supersedes: ["9", "10"] });
  });

  it("should keep the scheduled placement and previous ids, replacing a legacy entry", () => {
    // Arrange
    const placed = (id: string) => ({
      kind: "scheduled",
      workoutScheduleId: id,
      workoutId: "1707805999",
      date: "2026-09-27",
    });
    const row = garminRow({
      placement: {
        kind: "uncertain",
        workoutId: "1707805999",
        date: "2026-09-28",
        previous: placed("555"),
      },
      removalQueue: [QUEUED],
    });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.removalQueue).toEqual([
      { ...QUEUED, attempts: 0, state: "keep" },
    ]);
  });

  it("should never lower a placement id's stated state to keep", () => {
    // Arrange
    const gone = { ...QUEUED, state: "gone" };
    const row = garminRow({
      placement: {
        kind: "scheduled",
        workoutScheduleId: "555",
        workoutId: "1707805999",
        date: "2026-09-27",
      },
      removalQueue: [gone],
    });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.removalQueue).toEqual([gone]);
  });

  it("should drop an invalid placement and a forceRepush that is not true", () => {
    // Arrange
    const row = garminRow({
      placement: { kind: "scheduled", workoutScheduleId: "x", date: "soon" },
      forceRepush: "yes",
    });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next).not.toHaveProperty("placement");
    expect(next).not.toHaveProperty("forceRepush");
  });

  it("should be idempotent", () => {
    // Arrange
    const row = garminRow({
      destinationExternalId: "garmin-unconfirmed",
      removalQueue: [QUEUED, { bogus: true }],
      placement: {
        kind: "scheduled",
        workoutScheduleId: "777",
        workoutId: "1707805999",
        date: "2026-09-28",
      },
    });
    const once = normalizeGarminLedgerRow(row);

    // Act
    const twice = normalizeGarminLedgerRow(once);

    // Assert
    expect(twice).toStrictEqual(once);
  });

  it.each([
    { dataType: "workout", destinationBridgeId: "trainingpeaks-bridge" },
    { dataType: "body-composition", destinationBridgeId: "garmin-bridge" },
  ])(
    "should return a $dataType row for $destinationBridgeId untouched",
    (identity) => {
      // Arrange
      const row = garminRow({ ...identity, destinationExternalId: "pending" });

      // Act
      const next = normalizeGarminLedgerRow(row);

      // Assert
      expect(next).toBe(row);
    }
  );
});

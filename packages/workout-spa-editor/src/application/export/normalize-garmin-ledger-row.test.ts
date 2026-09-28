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
    const row = garminRow({
      removalQueue: [
        QUEUED,
        { ...QUEUED, workoutScheduleId: "stub-garmin-id" },
      ],
    });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.removalQueue).toEqual([QUEUED]);
  });

  it("should keep a held queue entry and drop one whose held is not true", () => {
    // Arrange
    const held = { ...QUEUED, held: true };
    const row = garminRow({
      removalQueue: [
        held,
        { ...QUEUED, workoutScheduleId: "556", held: false },
      ],
    });

    // Act
    const next = normalizeGarminLedgerRow(row);

    // Assert
    expect(next.removalQueue).toEqual([held]);
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

import { describe, expect, it } from "vitest";

import { garminPlacementSchema } from "../../types/garmin-ledger";
import { garminDateDrift } from "./garmin-date-drift";

const WORKOUT_DATE = "2026-10-08";
const OLD_DATE = "2026-10-06";

const placed = {
  kind: "scheduled",
  workoutScheduleId: "202",
  workoutId: "101",
};

const scheduled = (date: string) =>
  garminPlacementSchema.parse({ ...placed, date });

const unconfirmed = (date: string) =>
  garminPlacementSchema.parse({ kind: "unconfirmed", workoutId: "101", date });

const attempting = (date: string) =>
  garminPlacementSchema.parse({
    kind: "attempting",
    workoutId: "101",
    date,
    at: "2026-10-05T10:00:00.000Z",
    posted: false,
    previous: { ...placed, date: OLD_DATE },
  });

const uncertain = (date: string) =>
  garminPlacementSchema.parse({
    kind: "uncertain",
    workoutId: "101",
    date,
    previous: { ...placed, date: OLD_DATE },
  });

const workout = { date: WORKOUT_DATE };
const open = { locked: false };

describe("garminDateDrift", () => {
  it("should report a placed drift when the scheduled date differs", () => {
    // Arrange
    const row = { placement: scheduled(OLD_DATE) };

    // Act
    const drift = garminDateDrift(row, workout, open);

    // Assert
    expect(drift).toEqual({ placedOn: OLD_DATE, certainty: "placed" });
  });

  it("should report an unconfirmed drift when the unconfirmed date differs", () => {
    // Arrange
    const row = { placement: unconfirmed(OLD_DATE) };

    // Act
    const drift = garminDateDrift(row, workout, open);

    // Assert
    expect(drift).toEqual({ placedOn: OLD_DATE, certainty: "unconfirmed" });
  });

  it.each([
    ["scheduled on the same day", scheduled(WORKOUT_DATE)],
    ["unconfirmed on the same day", unconfirmed(WORKOUT_DATE)],
    ["attempting another day", attempting(OLD_DATE)],
    ["uncertain on another day", uncertain(OLD_DATE)],
  ])("should report no drift when the placement is %s", (_, placement) => {
    // Arrange
    const row = { placement };

    // Act
    const drift = garminDateDrift(row, workout, open);

    // Assert
    expect(drift).toBeUndefined();
  });

  it("should report no drift without a ledger row or placement", () => {
    // Arrange
    const rows = [undefined, { placement: undefined }];

    // Act
    const drifts = rows.map((row) => garminDateDrift(row, workout, open));

    // Assert
    expect(drifts).toEqual([undefined, undefined]);
  });

  it.each([scheduled(OLD_DATE), unconfirmed(OLD_DATE)])(
    "should report no drift for a locked session placed elsewhere (%o)",
    (placement) => {
      // Arrange
      const row = { placement };

      // Act
      const drift = garminDateDrift(row, workout, { locked: true });

      // Assert
      expect(drift).toBeUndefined();
    }
  );
});

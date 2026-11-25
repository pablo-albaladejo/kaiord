/**
 * Delete workout: the Workout and its Match go
 * together, so the Activity goes back to "To prepare"; Undo brings both back,
 * newer than their tombstones.
 */
import { describe, expect, it } from "vitest";

import { withTombstones } from "../../adapters/with-tombstones";
import {
  ACTIVITY_ID,
  PROFILE,
  seedSession,
} from "../session-move.test-fixtures";
import {
  deleteWorkoutAndMatch,
  restoreWorkoutAndMatch,
} from "./delete-coaching-workout";

const seed = async () => withTombstones(await seedSession());

describe("deleteWorkoutAndMatch", () => {
  it("should remove the Workout and its Match", async () => {
    // Arrange
    const persistence = await seed();

    // Act
    const deleted = await deleteWorkoutAndMatch(persistence, "w");

    // Assert
    expect(deleted?.workout.id).toBe("w");
    expect(deleted?.match?.id).toBe("m");
    expect(await persistence.workouts.getById("w")).toBeUndefined();
    expect(
      await persistence.sessionMatch.getByActivityId(PROFILE, ACTIVITY_ID)
    ).toBeUndefined();
    expect(
      await persistence.tombstones.get("sessionMatches", "m")
    ).toBeDefined();
  });

  it("should remove a Workout that has no Match", async () => {
    // Arrange
    const persistence = withTombstones(await seedSession({ match: null }));

    // Act
    const deleted = await deleteWorkoutAndMatch(persistence, "w");

    // Assert
    expect(deleted?.match).toBeUndefined();
    expect(await persistence.workouts.getById("w")).toBeUndefined();
  });

  it("should do nothing for a Workout that is already gone", async () => {
    // Arrange
    const persistence = await seed();
    await deleteWorkoutAndMatch(persistence, "w");

    // Act
    const again = await deleteWorkoutAndMatch(persistence, "w");

    // Assert
    expect(again).toBeUndefined();
  });
});

describe("restoreWorkoutAndMatch", () => {
  it("should bring back both the Workout and its Match, newer than their tombstones", async () => {
    // Arrange
    const persistence = await seed();
    const deleted = await deleteWorkoutAndMatch(persistence, "w");

    // Act
    await restoreWorkoutAndMatch(persistence, deleted!);

    // Assert
    expect(await persistence.workouts.getById("w")).toBeDefined();
    const match = await persistence.sessionMatch.getByActivityId(
      PROFILE,
      ACTIVITY_ID
    );
    expect(match?.workoutId).toBe("w");
    const tombstone = await persistence.tombstones.get("sessionMatches", "m");
    expect(Date.parse(match!.updatedAt!)).toBeGreaterThan(
      Date.parse(tombstone!.deletedAt)
    );
  });

  it("should leave the Activity's new Match alone when it was rebuilt meanwhile", async () => {
    // Arrange
    const persistence = await seed();
    const deleted = await deleteWorkoutAndMatch(persistence, "w");
    await persistence.sessionMatch.put({
      ...deleted!.match!,
      id: "m2",
      workoutId: "w2",
    });

    // Act
    await restoreWorkoutAndMatch(persistence, deleted!);

    // Assert
    const match = await persistence.sessionMatch.getByActivityId(
      PROFILE,
      ACTIVITY_ID
    );
    expect(match?.id).toBe("m2");
    expect(await persistence.workouts.getById("w")).toBeDefined();
  });
});

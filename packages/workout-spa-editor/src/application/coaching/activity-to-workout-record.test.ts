import { describe, expect, it } from "vitest";

import { buildSourceActivityRecord } from "../../types/activity-record";
import { activityToWorkoutRecord } from "./activity-to-workout-record";

describe("activityToWorkoutRecord", () => {
  it("should project a source activity into a renderable WorkoutRecord", () => {
    // Arrange
    const activity = buildSourceActivityRecord({
      profileId: "p1",
      date: "2026-07-05",
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "555",
      durationSeconds: 3600,
      distanceMeters: 10000,
    });

    // Act
    const workout = activityToWorkoutRecord(activity);

    // Assert
    expect(workout).toMatchObject({
      id: activity.id,
      profileId: "p1",
      date: "2026-07-05",
      sport: "running",
      source: "garmin-bridge",
      sourceId: "555",
      state: "structured",
      raw: {
        duration: { value: 3600, unit: "s" },
        distance: { value: 10000, unit: "m" },
      },
    });
  });

  it("should leave duration and distance null when the summary omits them", () => {
    // Arrange
    const activity = buildSourceActivityRecord({
      profileId: "p1",
      date: "2026-07-05",
      sport: "cycling",
      sourceBridgeId: "garmin-bridge",
      externalId: "9",
    });

    // Act
    const workout = activityToWorkoutRecord(activity);

    // Assert
    expect(workout.raw?.duration).toBeNull();
    expect(workout.raw?.distance).toBeNull();
  });
});

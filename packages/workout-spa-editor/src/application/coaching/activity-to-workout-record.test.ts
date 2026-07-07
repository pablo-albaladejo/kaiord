import { describe, expect, it } from "vitest";

import { buildSourceActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  activityToWorkoutRecord,
  isProjectedWorkoutRecord,
} from "./activity-to-workout-record";

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

  it("should mark the projection so callers can route it away from the editor", () => {
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
    expect(workout.projectedFromActivity).toBe(true);
    expect(isProjectedWorkoutRecord(workout)).toBe(true);
  });

  it("should not flag a real persisted WorkoutRecord as projected", () => {
    // Arrange
    const persisted: WorkoutRecord = {
      id: "w-1",
      profileId: "p1",
      date: "2026-07-05",
      sport: "cycling",
      source: "kaiord",
      sourceId: null,
      planId: null,
      state: "structured",
      raw: null,
      krd: null,
      lastProcessingError: null,
      feedback: null,
      aiMeta: null,
      garminPushId: null,
      tags: [],
      previousState: null,
      createdAt: "2026-07-05T00:00:00.000Z",
      modifiedAt: null,
      updatedAt: "2026-07-05T00:00:00.000Z",
    };

    // Act
    const result = isProjectedWorkoutRecord(persisted);

    // Assert
    expect(result).toBe(false);
  });
});

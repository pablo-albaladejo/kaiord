import { describe, expect, it } from "vitest";

import type { GarminRawActivity } from "./garmin-activity-schema";
import { mapGarminActivity } from "./map-garmin-activity";

describe("mapGarminActivity", () => {
  it("should map a raw Garmin activity to a summary-only ActivityRecord", () => {
    // Arrange
    const raw: GarminRawActivity = {
      activityId: 987654,
      startTimeLocal: "2026-07-05 07:30:00",
      activityType: { typeKey: "running" },
      distance: 10000,
      duration: 3600,
    };

    // Act
    const record = mapGarminActivity(raw, "profile-1");

    // Assert
    expect(record).toMatchObject({
      profileId: "profile-1",
      date: "2026-07-05",
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "987654",
      durationSeconds: 3600,
      distanceMeters: 10000,
      linkedWorkoutId: null,
      krd: null,
    });
  });

  it("should default the sport to unknown when the type is absent", () => {
    // Arrange
    const raw: GarminRawActivity = {
      activityId: 1,
      startTimeGMT: "2026-07-06 05:00:00",
    };

    // Act
    const record = mapGarminActivity(raw, "p");

    // Assert
    expect(record?.sport).toBe("unknown");
  });

  it("should return null when the activity has no usable date", () => {
    // Arrange
    const raw: GarminRawActivity = { activityId: 42 };

    // Act
    const record = mapGarminActivity(raw, "p");

    // Assert
    expect(record).toBeNull();
  });
});

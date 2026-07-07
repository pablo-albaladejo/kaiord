import { describe, expect, it } from "vitest";

import { activitySchema } from "./activity";

const validActivity = {
  kind: "activity" as const,
  summary: {
    date: "2026-04-29",
    start_time: "2026-04-29T06:30:00.000Z",
    sport: "cycling",
    duration_seconds: 3600,
    distance_meters: 30000,
    avg_heart_rate: 145,
    avg_power: 210,
    total_calories: 720,
    source: "garmin",
    source_id: "activity-99",
  },
};

describe("activitySchema", () => {
  it("should accept an activity with summary only (no krd)", () => {
    // Arrange

    // Act
    const result = activitySchema.safeParse(validActivity);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept an activity with an attached recorded krd", () => {
    // Arrange
    const withKrd = {
      ...validActivity,
      krd: {
        version: "2.0",
        type: "recorded_activity" as const,
        metadata: { created: "2026-04-29T06:30:00.000Z", sport: "cycling" },
        records: [],
      },
    };

    // Act
    const result = activitySchema.safeParse(withKrd);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an activity missing its summary", () => {
    // Arrange
    const invalid = { kind: "activity" as const };

    // Act
    const result = activitySchema.safeParse(invalid);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an avg_heart_rate above the physiological cap", () => {
    // Arrange
    const invalid = {
      ...validActivity,
      summary: { ...validActivity.summary, avg_heart_rate: 400 },
    };

    // Act
    const result = activitySchema.safeParse(invalid);

    // Assert
    expect(result.success).toBe(false);
  });
});

import type { Activity } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { mapWhoopActivity } from "./map-whoop-activity";

const makeActivity = (
  overrides: Partial<Activity["summary"]> = {}
): Activity => ({
  kind: "activity",
  summary: {
    date: "2026-07-10",
    start_time: "2026-07-10T08:15:00.000Z",
    sport: "Swimming",
    duration_seconds: 3030,
    avg_heart_rate: 142,
    total_calories: 299,
    source: "whoop",
    source_id: "3f2a9c1e-6b4d-4a1a-9e2f-7c8d1a5b9e60",
    ...overrides,
  },
});

describe("mapWhoopActivity", () => {
  it("should map a WHOOP KRD activity to a summary-only ActivityRecord", () => {
    // Arrange
    const activity = makeActivity();

    // Act
    const record = mapWhoopActivity(activity, "profile-1");

    // Assert
    expect(record).toMatchObject({
      profileId: "profile-1",
      date: "2026-07-10",
      sport: "Swimming",
      sourceBridgeId: "whoop-bridge",
      externalId: "3f2a9c1e-6b4d-4a1a-9e2f-7c8d1a5b9e60",
      durationSeconds: 3030,
      avgHeartRate: 142,
      totalCalories: 299,
      linkedWorkoutId: null,
      krd: null,
    });
  });

  it.each([
    { scenario: "no usable date", override: { date: "" } },
    { scenario: "no source id", override: { source_id: "" } },
  ])("should return null when the summary has $scenario", ({ override }) => {
    // Arrange
    const activity = makeActivity(override);

    // Act
    const record = mapWhoopActivity(activity, "profile-1");

    // Assert
    expect(record).toBeNull();
  });
});

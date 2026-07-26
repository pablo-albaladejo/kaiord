import { activitySchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  WORKOUT_ACTIVITY_ID,
  WORKOUT_FIXTURE,
  WORKOUT_SPORT_NAME,
  WORKOUT_START_TIME,
} from "../../test-utils/workout-fixture";
import type { WhoopWorkout } from "../schemas/whoop-workout.schema";
import { workoutToActivity } from "./workout-to-activity.converter";

const EXPECTED_DATE = "2026-07-10";
const EXPECTED_DURATION_SECONDS = 3030;
const EXPECTED_TOTAL_CALORIES = 299;
const EXPECTED_AVG_HEART_RATE = 142;
const FALLBACK_SPORT_NAME = "Activity";

describe("workoutToActivity", () => {
  it("should map a workout to an activity with sport, duration, kcal, and source_id", () => {
    // Arrange

    // Act
    const activity = workoutToActivity(WORKOUT_FIXTURE, WORKOUT_SPORT_NAME);

    // Assert
    expect(activity?.summary.sport).toBe(WORKOUT_SPORT_NAME);
    expect(activity?.summary.date).toBe(EXPECTED_DATE);
    expect(activity?.summary.start_time).toBe(WORKOUT_START_TIME);
    expect(activity?.summary.duration_seconds).toBe(EXPECTED_DURATION_SECONDS);
    expect(activity?.summary.total_calories).toBe(EXPECTED_TOTAL_CALORIES);
    expect(activity?.summary.avg_heart_rate).toBe(EXPECTED_AVG_HEART_RATE);
    expect(activity?.summary.source).toBe("whoop");
    expect(activity?.summary.source_id).toBe(WORKOUT_ACTIVITY_ID);
  });

  it("should produce an activity that validates against the KRD schema", () => {
    // Arrange
    const activity = workoutToActivity(WORKOUT_FIXTURE, WORKOUT_SPORT_NAME);

    // Act
    const result = activitySchema.safeParse(activity);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should use the passed fallback sport name for an unknown sport", () => {
    // Arrange

    // Act
    const activity = workoutToActivity(WORKOUT_FIXTURE, FALLBACK_SPORT_NAME);

    // Assert
    expect(activity?.summary.sport).toBe(FALLBACK_SPORT_NAME);
  });

  it.each([
    { scenario: "activity_id is missing", override: { activity_id: null } },
    { scenario: "during is missing", override: { during: null } },
    {
      scenario: "during does not match the expected range shape",
      override: { during: "not-a-range" },
    },
    {
      scenario: "during matches the shape but endpoints are not valid dates",
      override: { during: "['not-a-date','also-not-a-date')" },
    },
    {
      scenario: "the during window is inverted (end before start)",
      override: {
        during: "['2026-07-10T09:00:00.000Z','2026-07-10T08:00:00.000Z')",
      },
    },
  ])(
    "should return null when $scenario",
    ({ override }: { override: Partial<WhoopWorkout> }) => {
      // Arrange
      const workout: WhoopWorkout = { ...WORKOUT_FIXTURE, ...override };

      // Act
      const activity = workoutToActivity(workout, WORKOUT_SPORT_NAME);

      // Assert
      expect(activity).toBeNull();
    }
  );

  it("should date the activity in the workout's local timezone, not UTC", () => {
    // Arrange
    // A 9pm-local workout in a western timezone starts after UTC midnight
    // (05:00Z next day); applying the -08:00 offset keeps it on the local day.
    const workout: WhoopWorkout = {
      ...WORKOUT_FIXTURE,
      during: "['2026-07-11T05:00:00.000Z','2026-07-11T06:00:00.000Z')",
      timezone_offset: "-08:00",
    };

    // Act
    const activity = workoutToActivity(workout, WORKOUT_SPORT_NAME);

    // Assert
    expect(activity?.summary.date).toBe("2026-07-10");
    expect(activity?.summary.start_time).toBe("2026-07-11T05:00:00.000Z");
  });

  it("should omit total_calories and avg_heart_rate when kilojoules and average_heart_rate are absent", () => {
    // Arrange
    const workout: WhoopWorkout = {
      ...WORKOUT_FIXTURE,
      kilojoules: null,
      average_heart_rate: null,
    };

    // Act
    const activity = workoutToActivity(workout, WORKOUT_SPORT_NAME);

    // Assert
    expect(activity && "total_calories" in activity.summary).toBe(false);
    expect(activity && "avg_heart_rate" in activity.summary).toBe(false);
  });
});

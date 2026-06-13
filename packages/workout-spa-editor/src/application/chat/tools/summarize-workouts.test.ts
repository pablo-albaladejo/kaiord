import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { summarizeWorkouts } from "./summarize-workouts";

const TEN_MIN = 600;
const FIFTEEN_MIN = 900;
const SUM_TWO_WORKOUTS = TEN_MIN + FIFTEEN_MIN;
const TWO_HOURS = 7200;
const FILLER_SECS = 300;
const FILLER_COUNT = 60;
const ROW_CAP = 50;

const recordFor = (
  date: string,
  seconds: number,
  name = "Ride"
): WorkoutRecord =>
  ({
    id: `w-${date}`,
    profileId: "p1",
    date,
    sport: "cycling",
    state: "raw",
    krd: {
      extensions: {
        structured_workout: {
          sport: "cycling",
          name,
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    },
  }) as unknown as WorkoutRecord;

describe("summarizeWorkouts", () => {
  it("should count workouts and sum their durations", () => {
    // Arrange
    const records = [
      recordFor("2026-06-01", TEN_MIN),
      recordFor("2026-06-02", FIFTEEN_MIN),
    ];

    // Act
    const summary = summarizeWorkouts(records);

    // Assert
    expect(summary.count).toBe(2);
    expect(summary.totalDurationSeconds).toBe(SUM_TWO_WORKOUTS);
  });

  it("should report the longest workout even when it predates the row cap", () => {
    // Arrange
    // Many short workouts after one very long one; the row cap is 50.
    const long = recordFor("2026-01-01", TWO_HOURS, "Epic");
    const many = Array.from({ length: FILLER_COUNT }, () =>
      recordFor("2026-06-15", FILLER_SECS)
    );

    // Act
    const summary = summarizeWorkouts([long, ...many]);

    // Assert
    expect(summary.longest?.name).toBe("Epic");
    expect(summary.longest?.durationSeconds).toBe(TWO_HOURS);
    expect(summary.workouts.length).toBeLessThanOrEqual(ROW_CAP);
  });

  it("should return a null longest when no workout has a duration", () => {
    // Arrange
    const open = {
      id: "w-x",
      profileId: "p1",
      date: "2026-06-01",
      sport: "running",
      state: "raw",
      krd: null,
    } as unknown as WorkoutRecord;

    // Act
    const summary = summarizeWorkouts([open]);

    // Assert
    expect(summary.longest).toBeNull();
  });
});

import { createWorkoutKRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { profileWith } from "../../../lib/athlete/test-profile";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { reviewFor } from "./today-load";

const STEP_SECONDS = 600;
const FTP_PERCENT = 60;
const FTP_WATTS = 250;

function rawWorkout(date: string): WorkoutRecord {
  return {
    id: `id-${date}`,
    profileId: "p1",
    date,
    sport: "cycling",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: null,
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-05-27T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-05-27T08:00:00.000Z",
  };
}

function krdWorkout(date: string): WorkoutRecord {
  return {
    ...rawWorkout(date),
    state: "structured",
    krd: createWorkoutKRD({
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: STEP_SECONDS },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "percent_ftp", value: FTP_PERCENT },
          },
        },
      ],
    }),
  };
}

describe("reviewFor", () => {
  it("should derive a review model from a record with a KRD and profile zones", () => {
    // Arrange
    const record = krdWorkout("2026-05-27");
    const profile = profileWith("cycling", { ftp: FTP_WATTS });

    // Act
    const review = reviewFor(record, profile);

    // Assert
    expect(review).not.toBeNull();
    expect(review?.tss).toBeGreaterThan(0);
  });

  it("should return null when the record has no KRD", () => {
    // Arrange
    const record = rawWorkout("2026-05-27");

    // Act
    const review = reviewFor(record, null);

    // Assert
    expect(review).toBeNull();
  });
});

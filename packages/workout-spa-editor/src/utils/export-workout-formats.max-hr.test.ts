import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { profileWith } from "../lib/athlete/test-profile";
import { MaxHrUnavailableError } from "../types/max-hr-unavailable-error";
import { exportWorkout } from "./export-workout";
import { exportGcnWorkout } from "./export-workout-formats";

const MAX_HR = 190;
// 85 % of 190 bpm = 162 bpm; Garmin gets it as its ±3 bpm band.
const AEROBIC_BAND_LOW_BPM = 159;
const AEROBIC_BAND_HIGH_BPM = 165;

const percentMaxKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "Aerobic",
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "heart_rate",
          target: {
            type: "heart_rate",
            value: { unit: "percent_max", value: 85 },
          },
        },
      ],
    },
  },
};

type GcnStep = { targetValueOne: number; targetValueTwo: number };
const firstStep = (gcn: unknown): GcnStep =>
  (gcn as { workoutSegments: [{ workoutSteps: [GcnStep] }] }).workoutSegments[0]
    .workoutSteps[0];

describe("exportGcnWorkout — %max HR", () => {
  it("should write %max HR targets as bpm from the profile's max heart rate", async () => {
    // Arrange
    const profile = profileWith("running", {}, MAX_HR);

    // Act
    const gcn = await exportGcnWorkout(percentMaxKrd, profile);

    // Assert
    expect(firstStep(gcn)).toMatchObject({
      targetValueOne: AEROBIC_BAND_LOW_BPM,
      targetValueTwo: AEROBIC_BAND_HIGH_BPM,
    });
  });

  it.each([null, profileWith("running", {})])(
    "should refuse a %max HR workout when the profile has no max heart rate (%#)",
    async (profile) => {
      // Arrange

      // Act
      const run = exportGcnWorkout(percentMaxKrd, profile);

      // Assert
      await expect(run).rejects.toBeInstanceOf(MaxHrUnavailableError);
      await expect(run).rejects.toMatchObject({ reason: "missing-max-hr" });
    }
  );

  it("should carry the refusal as the cause of a GCN file export", async () => {
    // Arrange

    // Act
    const run = exportWorkout(percentMaxKrd, "gcn", undefined, null);

    // Assert
    await expect(run).rejects.toMatchObject({
      cause: expect.any(MaxHrUnavailableError),
    });
  });
});

import type { KRD, Target } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { profileWith } from "../lib/athlete/test-profile";
import { FtpUnavailableError } from "../types/ftp-unavailable-error";
import { exportWorkout } from "./export-workout";
import { exportGcnWorkout } from "./export-workout-formats";

const FTP_W = 250;
// 85 % of 250 W = 213 W; Garmin gets a single value as its ±5 % band.
const SWEET_SPOT_BAND_HIGH_W = 224;
const SWEET_SPOT_BAND_LOW_W = 202;
const RAMP_LOW_W = 125;
const RAMP_HIGH_W = 188;

const SWEET_SPOT: Target = {
  type: "power",
  value: { unit: "percent_ftp", value: 85 },
};
const WARM_UP_RAMP: Target = {
  type: "power",
  value: { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
};

const percentFtpKrd = (sport: string, target: Target = SWEET_SPOT): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport },
  extensions: {
    structured_workout: {
      name: "Sweet spot",
      sport,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target,
        },
      ],
    },
  },
});

type GcnStep = { targetValueOne: number; targetValueTwo: number };
const firstStep = (gcn: unknown): GcnStep =>
  (gcn as { workoutSegments: [{ workoutSteps: [GcnStep] }] }).workoutSegments[0]
    .workoutSteps[0];

describe("exportGcnWorkout — %FTP targets", () => {
  it("should write %FTP power targets as watts from the profile's FTP", async () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP_W });

    // Act
    const gcn = await exportGcnWorkout(percentFtpKrd("cycling"), profile);

    // Assert
    expect(firstStep(gcn)).toMatchObject({
      targetValueOne: SWEET_SPOT_BAND_HIGH_W,
      targetValueTwo: SWEET_SPOT_BAND_LOW_W,
    });
  });

  it.each([
    { sport: "cycling", reason: "missing-ftp" },
    { sport: "generic", reason: "sport-without-power-zones" },
  ])(
    "should refuse a %FTP $sport workout with $reason when the profile has no FTP",
    async ({ sport, reason }) => {
      // Arrange
      const krd = percentFtpKrd(sport);

      // Act
      const run = exportGcnWorkout(krd, null);

      // Assert
      await expect(run).rejects.toBeInstanceOf(FtpUnavailableError);
      await expect(run).rejects.toMatchObject({ reason });
    }
  );

  it("should refuse a %FTP swimming workout even when its profile stores a swimming FTP", async () => {
    // Arrange
    const profile = profileWith("swimming", { ftp: FTP_W });

    // Act
    const run = exportGcnWorkout(percentFtpKrd("swimming"), profile);

    // Assert
    await expect(run).rejects.toMatchObject({
      reason: "sport-without-power-zones",
    });
  });

  it("should carry the reason as the cause of a GCN file export", async () => {
    // Arrange
    const krd = percentFtpKrd("cycling");

    // Act
    const run = exportWorkout(krd, "gcn", undefined, null);

    // Assert
    await expect(run).rejects.toMatchObject({
      cause: expect.any(FtpUnavailableError),
    });
  });
});

describe("exportGcnWorkout — %FTP ranges", () => {
  it("should write a percent_ftp range as watts from the profile's FTP", async () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP_W });
    const krd = percentFtpKrd("cycling", WARM_UP_RAMP);

    // Act
    const gcn = await exportGcnWorkout(krd, profile);

    // Assert
    expect(firstStep(gcn)).toMatchObject({
      targetValueOne: RAMP_HIGH_W,
      targetValueTwo: RAMP_LOW_W,
    });
  });

  it("should refuse a percent_ftp range when the profile has no FTP", async () => {
    // Arrange
    const krd = percentFtpKrd("cycling", WARM_UP_RAMP);

    // Act
    const run = exportGcnWorkout(krd, null);

    // Assert
    await expect(run).rejects.toMatchObject({ reason: "missing-ftp" });
  });
});

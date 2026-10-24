import type { KRD, Target } from "@kaiord/core";
import { MissingMaxHeartRateError, toText } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createGarminWriter } from "../../index";
import { MAX_HR_RESOLUTION as H } from "../../test-utils/constants";
import { convertKrdTargetToGarmin } from "./target-to-garmin.converter";

const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const percentMax: Target = {
  type: "heart_rate",
  value: { unit: "percent_max", value: H.PCT },
};

const workout: KRD = {
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
          target: percentMax,
        },
      ],
    },
  },
};

type GcnStep = { targetValueOne: number | null; targetValueTwo: number | null };

const firstStep = (gcn: string): GcnStep =>
  (JSON.parse(gcn) as { workoutSegments: [{ workoutSteps: [GcnStep] }] })
    .workoutSegments[0].workoutSteps[0];

describe("convertKrdTargetToGarmin percent_max heart rate", () => {
  it("should resolve percent_max to bpm with the max HR and send its band", () => {
    // Arrange
    const options = { maxHeartRate: H.MAX_HR_BPM };

    // Act
    const result = convertKrdTargetToGarmin(percentMax, options);

    // Assert
    // 85 % of 190 bpm = 162 bpm, sent as 159-165 bpm, lower bound first.
    expect(result.targetType.workoutTargetTypeKey).toBe("heart.rate.zone");
    expect(result.targetValueOne).toBe(H.BAND_LOW_BPM);
    expect(result.targetValueTwo).toBe(H.BAND_HIGH_BPM);
    expect(result.zoneNumber).toBeNull();
  });

  it("should throw MissingMaxHeartRateError when no max HR is provided", () => {
    // Arrange

    // Act
    const convert = () => convertKrdTargetToGarmin(percentMax);

    // Assert
    expect(convert).toThrow(MissingMaxHeartRateError);
  });
});

describe("createGarminWriter maxHeartRate option", () => {
  it("should write percent_max heart-rate targets as a bpm band", async () => {
    // Arrange
    const writer = createGarminWriter({
      logger: silentLogger,
      maxHeartRate: H.MAX_HR_BPM,
    });

    // Act
    const gcn = await toText(workout, writer, silentLogger);

    // Assert
    expect(firstStep(gcn)).toMatchObject({
      targetValueOne: H.BAND_LOW_BPM,
      targetValueTwo: H.BAND_HIGH_BPM,
    });
  });

  it("should reject percent_max heart-rate targets when no max HR is configured", async () => {
    // Arrange
    const writer = createGarminWriter(silentLogger);

    // Act
    const write = toText(workout, writer, silentLogger);

    // Assert
    await expect(write).rejects.toBeInstanceOf(MissingMaxHeartRateError);
  });
});

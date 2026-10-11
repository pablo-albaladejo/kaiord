/**
 * KRD → FIT → KRD for every duration and target the FIT writer supports,
 * through the real SDK Encoder and Decoder. Each case writes one step and
 * expects the decoded step to equal the one that was written.
 */
import type { Duration, KRD, Target, WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";

const logger = createMockLogger();
const read = createGarminFitSdkReader(logger);
const write = createGarminFitSdkWriter(logger);

const OPEN: Target = { type: "open" };
const ONE_MINUTE: Duration = { type: "time", seconds: 60 };

const DURATIONS: Array<Duration> = [
  { type: "time", seconds: 90 },
  { type: "distance", meters: 1234.5 },
  { type: "calories", calories: 50 },
  { type: "heart_rate_less_than", bpm: 130 },
  { type: "power_less_than", watts: 150 },
  { type: "power_greater_than", watts: 300 },
  { type: "repeat_until_time", seconds: 600, repeatFrom: 0 },
  { type: "repeat_until_distance", meters: 2000, repeatFrom: 0 },
  { type: "repeat_until_calories", calories: 100, repeatFrom: 0 },
  { type: "repeat_until_heart_rate_greater_than", bpm: 160, repeatFrom: 0 },
  { type: "repeat_until_heart_rate_less_than", bpm: 120, repeatFrom: 0 },
  { type: "repeat_until_power_less_than", watts: 180, repeatFrom: 0 },
  { type: "repeat_until_power_greater_than", watts: 250, repeatFrom: 0 },
  { type: "open" },
];

const TARGETS: Array<Target> = [
  OPEN,
  { type: "power", value: { unit: "watts", value: 250 } },
  { type: "power", value: { unit: "percent_ftp", value: 85 } },
  { type: "power", value: { unit: "zone", value: 3 } },
  { type: "power", value: { unit: "range", min: 200, max: 250 } },
  { type: "heart_rate", value: { unit: "bpm", value: 145 } },
  { type: "heart_rate", value: { unit: "zone", value: 2 } },
  { type: "heart_rate", value: { unit: "percent_max", value: 75 } },
  { type: "heart_rate", value: { unit: "range", min: 130, max: 150 } },
  { type: "cadence", value: { unit: "rpm", value: 90 } },
  { type: "cadence", value: { unit: "range", min: 85, max: 95 } },
  { type: "pace", value: { unit: "mps", value: 3.5 } },
  { type: "pace", value: { unit: "zone", value: 2 } },
  { type: "pace", value: { unit: "range", min: 3.2, max: 3.8 } },
  { type: "stroke_type", value: { unit: "swim_stroke", value: 2 } },
];

const step = (duration: Duration, target: Target): WorkoutStep => ({
  stepIndex: 0,
  durationType: duration.type,
  duration,
  targetType: target.type,
  target,
  intensity: "active",
});

const workoutKrd = (steps: Array<WorkoutStep>, sport: string): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2024-01-01T00:00:00.000Z", sport },
  extensions: { structured_workout: { name: "Matrix", sport, steps } },
});

const stepsAfterRoundTrip = async (krd: KRD): Promise<unknown> => {
  const reimported = await read(await write(krd));
  return (reimported.extensions?.structured_workout as { steps: unknown })
    .steps;
};

describe("Round-trip: every workout duration and target", () => {
  it.each(DURATIONS)("should preserve a $type duration", async (duration) => {
    // Arrange
    const steps = [step(duration, OPEN)];

    // Act
    const result = await stepsAfterRoundTrip(workoutKrd(steps, "cycling"));

    // Assert
    expect(result).toEqual(steps);
  });

  it.each(TARGETS)(
    "should preserve a $type target ($value.unit)",
    async (target) => {
      // Arrange
      const sport = target.type === "stroke_type" ? "swimming" : "cycling";
      const steps = [step(ONE_MINUTE, target)];

      // Act
      const result = await stepsAfterRoundTrip(workoutKrd(steps, sport));

      // Assert
      expect(result).toEqual(steps);
    }
  );
});

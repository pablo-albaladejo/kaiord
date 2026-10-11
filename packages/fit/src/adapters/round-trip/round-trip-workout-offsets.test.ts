/**
 * The FIT profile types `workoutHr` and `workoutPower` overload one integer:
 * 0-100 is %max HR and 0-1000 is %FTP, while absolute values are stored with
 * a +100 bpm / +1000 W offset (`Profile.types.workoutHr = {100: bpmOffset}`,
 * `workoutPower = {1000: wattsOffset}`). Custom HR/power target ranges and
 * HR/power duration conditions use these types. KRD ranges and conditions
 * are absolute bpm/watts, so the writer must add the offset and the reader
 * must remove it. A KRD-only round-trip cannot see a symmetric omission, so
 * these tests read the raw values the SDK Decoder returns.
 */
import { Decoder, Stream } from "@garmin/fitsdk";
import type { Duration, KRD, Target, WorkoutStep } from "@kaiord/core";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";

const logger = createMockLogger();
const read = createGarminFitSdkReader(logger);
const write = createGarminFitSdkWriter(logger);

type RawStep = Record<string, unknown>;

const rawSteps = (bytes: Uint8Array): Array<RawStep> => {
  const { messages } = new Decoder(Stream.fromByteArray(bytes)).read();
  return (messages.workoutStepMesgs ?? []) as Array<RawStep>;
};

const stepsOf = (krd: KRD): Array<WorkoutStep> =>
  (krd.extensions?.structured_workout as { steps: Array<WorkoutStep> }).steps;

const OPEN: Target = { type: "open" };
const ONE_MINUTE: Duration = { type: "time", seconds: 60 };

const krdWith = (duration: Duration, target: Target): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2024-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Offsets",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: duration.type,
          duration,
          targetType: target.type,
          target,
          intensity: "active",
        },
      ],
    },
  },
});

const writtenStep = async (duration: Duration, target: Target) =>
  rawSteps(await write(krdWith(duration, target)))[0];

describe("Round-trip: workoutHr/workoutPower offsets through the real encoder", () => {
  it("should read the Garmin hrLessThan 225 condition as 125 bpm", async () => {
    // Arrange
    const fixture = loadFitFixture("WorkoutCustomTargetValues.fit");

    // Act
    const krd = await read(fixture);

    // Assert
    expect(stepsOf(krd)[3]?.duration).toStrictEqual({
      type: "heart_rate_less_than",
      bpm: 125,
    });
  });

  it("should write back the Garmin absolute power ranges and HR condition unchanged", async () => {
    // Arrange
    const fixture = loadFitFixture("WorkoutCustomTargetValues.fit");
    const absoluteFields = [
      "customTargetPowerLow",
      "customTargetPowerHigh",
      "durationHr",
    ];
    const pick = (step: RawStep | undefined) =>
      Object.fromEntries(
        absoluteFields
          .filter((f) => step?.[f] !== undefined)
          .map((f) => [f, step?.[f]])
      );

    // Act
    const written = rawSteps(await write(await read(fixture)));

    // Assert
    // Power steps carry absolute ranges (and step 3 the hrLessThan 225
    // condition); step 0 is a 50-60 %max-HR range, which KRD cannot express.
    const original = rawSteps(fixture);
    const powerSteps = original.filter((s) => s.targetType === "power");
    expect(powerSteps).not.toHaveLength(0);
    for (const step of powerSteps) {
      const index = step.messageIndex as number;
      expect(pick(written[index])).toStrictEqual(pick(step));
    }
  });

  it.each([
    {
      target: { type: "power", value: { unit: "range", min: 200, max: 250 } },
      raw: { customTargetPowerLow: 1200, customTargetPowerHigh: 1250 },
    },
    {
      target: {
        type: "heart_rate",
        value: { unit: "range", min: 130, max: 150 },
      },
      raw: { customTargetHeartRateLow: 230, customTargetHeartRateHigh: 250 },
    },
  ] as Array<{ target: Target; raw: RawStep }>)(
    "should write a $target.type range with the absolute offset",
    async ({ target, raw }) => {
      // Arrange
      const duration = ONE_MINUTE;

      // Act
      const step = await writtenStep(duration, target);

      // Assert
      expect(step).toMatchObject(raw);
    }
  );

  it.each([
    {
      duration: { type: "heart_rate_less_than", bpm: 125 },
      raw: { durationHr: 225 },
    },
    {
      duration: { type: "power_less_than", watts: 150 },
      raw: { durationPower: 1150 },
    },
    {
      duration: { type: "power_greater_than", watts: 300 },
      raw: { durationPower: 1300 },
    },
    {
      duration: {
        type: "repeat_until_heart_rate_greater_than",
        bpm: 160,
        repeatFrom: 0,
      },
      raw: { repeatHr: 260 },
    },
    {
      duration: {
        type: "repeat_until_heart_rate_less_than",
        bpm: 120,
        repeatFrom: 0,
      },
      raw: { repeatHr: 220 },
    },
    {
      duration: {
        type: "repeat_until_power_less_than",
        watts: 180,
        repeatFrom: 0,
      },
      raw: { repeatPower: 1180 },
    },
    {
      duration: {
        type: "repeat_until_power_greater_than",
        watts: 250,
        repeatFrom: 0,
      },
      raw: { repeatPower: 1250 },
    },
  ] as Array<{ duration: Duration; raw: RawStep }>)(
    "should write a $duration.type condition with the absolute offset",
    async ({ duration, raw }) => {
      // Arrange
      const target = OPEN;

      // Act
      const step = await writtenStep(duration, target);

      // Assert
      expect(step).toMatchObject(raw);
    }
  );
});

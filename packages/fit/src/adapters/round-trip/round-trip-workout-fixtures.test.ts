/**
 * FIT → KRD → FIT → KRD fidelity for the workout fixtures, through the real
 * SDK Encoder and Decoder (no hand-built messages). The Encoder silently
 * drops values set under sub-field names, so only an actual encode/decode
 * cycle catches a writer that loses durations, targets or repeat blocks.
 */
import type { KRD } from "@kaiord/core";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";

const logger = createMockLogger();
const read = createGarminFitSdkReader(logger);
const write = createGarminFitSdkWriter(logger);

const REPEAT_COUNT = 3;
const STEP_DISTANCE_METERS = 500;
const B1_POWER_ZONE = 5;

const stepsOf = (krd: KRD): unknown =>
  (krd.extensions?.structured_workout as { steps: Array<unknown> }).steps;

const roundTrip = async (fixture: string) => {
  const original = await read(loadFitFixture(fixture));
  const reimported = await read(await write(original));
  return { original, reimported };
};

describe("Round-trip: workout fixtures through the real encoder", () => {
  it.each([
    "WorkoutRepeatSteps.fit",
    "WorkoutIndividualSteps.fit",
    "WorkoutCustomTargetValues.fit",
    "WorkoutRepeatGreaterThanStep.fit",
  ])(
    "should re-import %s with identical steps, durations and targets",
    async (fixture) => {
      // Arrange
      const name = fixture;

      // Act
      const { original, reimported } = await roundTrip(name);

      // Assert
      expect(stepsOf(reimported)).toStrictEqual(stepsOf(original));
    }
  );

  it("should keep the repeat block of WorkoutRepeatSteps.fit", async () => {
    // Arrange
    const fixture = "WorkoutRepeatSteps.fit";

    // Act
    const { reimported } = await roundTrip(fixture);

    // Assert
    const block = (stepsOf(reimported) as Array<Record<string, unknown>>)[1];
    expect(block).toMatchObject({ repeatCount: REPEAT_COUNT });
    expect(block?.steps).toHaveLength(2);
  });

  it("should keep distances and targets of WorkoutIndividualSteps.fit", async () => {
    // Arrange
    const fixture = "WorkoutIndividualSteps.fit";

    // Act
    const { reimported } = await roundTrip(fixture);

    // Assert
    expect((stepsOf(reimported) as Array<unknown>)[1]).toMatchObject({
      duration: { type: "distance", meters: STEP_DISTANCE_METERS },
      target: { type: "power", value: { unit: "zone", value: B1_POWER_ZONE } },
    });
  });

  it("should keep the repeat-until-HR condition of WorkoutRepeatGreaterThanStep.fit", async () => {
    // Arrange
    const fixture = "WorkoutRepeatGreaterThanStep.fit";

    // Act
    const { reimported } = await roundTrip(fixture);

    // Assert
    expect((stepsOf(reimported) as Array<unknown>)[3]).toMatchObject({
      duration: {
        type: "repeat_until_heart_rate_greater_than",
        repeatFrom: 1,
      },
    });
  });
});

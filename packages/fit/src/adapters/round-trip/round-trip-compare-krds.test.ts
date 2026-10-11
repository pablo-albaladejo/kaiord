import { createToleranceChecker, validateRoundTrip } from "@kaiord/core";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";

const logger = createMockLogger();
const validator = validateRoundTrip(
  createGarminFitSdkReader(logger),
  createGarminFitSdkWriter(logger),
  createToleranceChecker(),
  logger
);

describe("Round-trip: core validateRoundTrip on the workout fixtures", () => {
  it.each([
    "WorkoutRepeatSteps.fit",
    "WorkoutIndividualSteps.fit",
    "WorkoutCustomTargetValues.fit",
    "WorkoutRepeatGreaterThanStep.fit",
  ])(
    "should report no step violation for the round-trip of %s",
    async (fixture) => {
      // Arrange
      const originalBinary = loadFitFixture(fixture);

      // Act
      const violations = await validator.validateBinaryRoundTrip({
        originalBinary,
      });

      // Assert
      expect(violations).toStrictEqual([]);
    }
  );
});

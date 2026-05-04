import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";

describe("Round-trip: Workout metadata - subSport field", () => {
  it("should preserve subSport through FIT → KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        subSport?: string;
        steps: Array<unknown>;
      };
      workout.subSport = "trail";
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(workoutMsg).toBeDefined();
    expect(workoutMsg?.subSport).toBe("trail");
  });

  it("should preserve exact subSport string value", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const subSportValues = ["trail", "road", "track", "treadmill", "mountain"];

    // Assert
    for (const subSport of subSportValues) {
      const krd = await reader(originalBuffer);

      // Set subSport
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
          name?: string;
          sport: string;
          subSport?: string;
          steps: Array<unknown>;
        };
        workout.subSport = subSport;
      }

      const messages = convertKRDToMessages(krd, logger);

      const workoutMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      expect(workoutMsg?.subSport).toBe(subSport);
    }
  });

  it("should omit subSport when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        subSport?: string;
        steps: Array<unknown>;
      };
      workout.subSport = undefined;
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(workoutMsg)?.not.toHaveProperty("subSport");
  });
});

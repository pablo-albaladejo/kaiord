import { describe, expect, it } from "vitest";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";

describe("Round-trip: Workout metadata - subSport field", () => {
  it("should preserve subSport through FIT → KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Manually set subSport for testing (since test files may not have it)
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        subSport?: string;
        steps: Array<unknown>;
      };
      workout.subSport = "trail";
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check workout message has subSport
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(workoutMsg).toBeDefined();
    expect(workoutMsg?.subSport).toBe("trail");
  });

  it("should preserve exact subSport string value", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Test multiple subSport values
    const subSportValues = ["trail", "road", "track", "treadmill", "mountain"];

    for (const subSport of subSportValues) {
      // Act - FIT → KRD
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

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert
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

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Ensure subSport is undefined
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        subSport?: string;
        steps: Array<unknown>;
      };
      workout.subSport = undefined;
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(workoutMsg)?.not.toHaveProperty("subSport");
  });
});

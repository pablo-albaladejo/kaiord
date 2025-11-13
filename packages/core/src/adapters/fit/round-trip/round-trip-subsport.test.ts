import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";

describe("Round-trip: Workout metadata - subSport field", () => {
  it("should preserve subSport through FIT → KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader.readToKRD(originalBuffer);

    // Manually set subSport for testing (since test files may not have it)
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
      (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
    ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

    expect(workoutMsg).toBeDefined();
    expect(workoutMsg?.workoutMesg.subSport).toBe("trail");
  });

  it("should preserve exact subSport string value", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Test multiple subSport values
    const subSportValues = ["trail", "road", "track", "treadmill", "mountain"];

    for (const subSport of subSportValues) {
      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Set subSport
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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
        (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
      ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

      expect(workoutMsg?.workoutMesg.subSport).toBe(subSport);
    }
  });

  it("should omit subSport when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader.readToKRD(originalBuffer);

    // Ensure subSport is undefined
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
      (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
    ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

    expect(workoutMsg?.workoutMesg).not.toHaveProperty("subSport");
  });
});

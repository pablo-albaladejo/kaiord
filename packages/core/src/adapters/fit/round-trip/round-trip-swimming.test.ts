import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";

describe("Round-trip: Swimming workouts - pool length conversion and unit handling", () => {
  it("should preserve poolLength in meters through KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Set poolLength
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<unknown>;
      };
      workout.poolLength = 25;
      workout.poolLengthUnit = "meters";
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(workoutMsg).toBeDefined();
    expect(workoutMsg.poolLength).toBe(25);
    expect(workoutMsg.poolLengthUnit).toBe(0);
  });

  it("should preserve poolLength within tolerance through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);
    const poolLengths = [25, 50, 33.33];

    for (const poolLength of poolLengths) {
      // Act - FIT → KRD
      const krd = await reader(originalBuffer);

      // Set poolLength
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
          name?: string;
          sport: string;
          poolLength?: number;
          poolLengthUnit?: "meters";
          steps: Array<unknown>;
        };
        workout.poolLength = poolLength;
        workout.poolLengthUnit = "meters";
      }

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert - Within ±0.01 meters tolerance
      const workoutMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      expect(workoutMsg).toBeDefined();
      expect(workoutMsg.poolLength).toBeCloseTo(poolLength, 2);
    }
  });

  it("should always set poolLengthUnit to 0 (meters) in FIT", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Set poolLength (KRD always stores in meters)
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<unknown>;
      };
      workout.poolLength = 50;
      workout.poolLengthUnit = "meters";
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - poolLengthUnit should always be 0 (meters)
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(workoutMsg).toBeDefined();
    expect(workoutMsg.poolLengthUnit).toBe(0);
  });

  it("should omit poolLength when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Ensure poolLength is undefined
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<unknown>;
      };
      workout.poolLength = undefined;
      workout.poolLengthUnit = undefined;
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(workoutMsg).toBeDefined();
    expect(workoutMsg).not.toHaveProperty("poolLength");
    expect(workoutMsg).not.toHaveProperty("poolLengthUnit");
  });
});

describe("Round-trip: Swimming workouts - equipment mapping (snake_case ↔ camelCase)", () => {
  it("should preserve equipment through KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Set equipment on first step
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          equipment?: string;
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].equipment = "swim_fins";
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; equipment: string } | undefined;

    expect(stepMsg?.equipment).toBe("swimFins");
  });

  it("should preserve exact equipment values through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Test multiple equipment values
    const equipmentValues = [
      { krd: "swim_fins", fit: "swimFins" },
      { krd: "swim_kickboard", fit: "swimKickboard" },
      { krd: "swim_paddles", fit: "swimPaddles" },
      { krd: "swim_pull_buoy", fit: "swimPullBuoy" },
      { krd: "swim_snorkel", fit: "swimSnorkel" },
    ];

    for (const equipment of equipmentValues) {
      // Act - FIT → KRD
      const krd = await reader(originalBuffer);

      // Set equipment
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
          name?: string;
          sport: string;
          steps: Array<{
            stepIndex: number;
            equipment?: string;
            [key: string]: unknown;
          }>;
        };
        if (workout.steps.length > 0) {
          workout.steps[0].equipment = equipment.krd;
        }
      }

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === 0
      ) as { mesgNum: number; equipment: string } | undefined;

      expect(stepMsg?.equipment).toBe(equipment.fit);
    }
  });

  it("should omit equipment when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Ensure equipment is undefined
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          equipment?: string;
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].equipment = undefined;
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(stepMsg).not.toHaveProperty("equipment");
  });

  it("should preserve equipment on multiple steps", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);
    const equipmentArray = [
      { krd: "swim_fins", fit: "swimFins" },
      { krd: "swim_kickboard", fit: "swimKickboard" },
      { krd: "swim_paddles", fit: "swimPaddles" },
      { krd: "none", fit: "none" },
    ];

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Add equipment to all steps
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          equipment?: string;
          [key: string]: unknown;
        }>;
      };
      workout.steps.forEach((step, index) => {
        if (index < equipmentArray.length) {
          step.equipment = equipmentArray[index].krd;
        }
      });
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check all steps have correct equipment
    for (let i = 0; i < equipmentArray.length; i++) {
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === i
      ) as { mesgNum: number; equipment: string } | undefined;

      expect(stepMsg?.equipment).toBe(equipmentArray[i].fit);
    }
  });
});

describe("Round-trip: Swimming workouts - combined pool length and equipment", () => {
  it("should preserve both poolLength and equipment in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);
    const testPoolLength = 50;
    const testEquipment = "swim_fins";

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Set both poolLength and equipment
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<{
          stepIndex: number;
          equipment?: string;
          [key: string]: unknown;
        }>;
      };
      workout.poolLength = testPoolLength;
      workout.poolLengthUnit = "meters";
      if (workout.steps.length > 0) {
        workout.steps[0].equipment = testEquipment;
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check workout message has poolLength
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as
      | { mesgNum: number; poolLength: number; poolLengthUnit: number }
      | undefined;

    expect(workoutMsg).toBeDefined();
    expect(workoutMsg.poolLength).toBe(testPoolLength);
    expect(workoutMsg.poolLengthUnit).toBe(0);

    // Assert - Check step message has equipment
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; equipment: string } | undefined;

    expect(stepMsg?.equipment).toBe("swimFins");
  });
});

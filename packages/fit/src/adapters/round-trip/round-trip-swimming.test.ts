import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  FIT_POOL_LENGTH_25,
  FIT_POOL_LENGTH_33_33,
  FIT_POOL_LENGTH_50,
} from "../../test-utils/constants";
import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";

describe("Round-trip: Swimming workouts - pool length conversion and unit handling", () => {
  it("should preserve poolLength in meters through KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<unknown>;
      };
      workout.poolLength = 25;
      workout.poolLengthUnit = "meters";
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(workoutMsg).toBeDefined();
    expect(workoutMsg.poolLength).toBe(FIT_POOL_LENGTH_25);
    expect(workoutMsg.poolLengthUnit).toBe(0);
  });

  it("should preserve poolLength within tolerance through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const poolLengths = [
      FIT_POOL_LENGTH_25,
      FIT_POOL_LENGTH_50,
      FIT_POOL_LENGTH_33_33,
    ];

    // Assert
    for (const poolLength of poolLengths) {
      const krd = await reader(originalBuffer);

      // Set poolLength
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
          name?: string;
          sport: string;
          poolLength?: number;
          poolLengthUnit?: "meters";
          steps: Array<unknown>;
        };
        workout.poolLength = poolLength;
        workout.poolLengthUnit = "meters";
      }

      const messages = convertKRDToMessages(krd, logger);

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
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<unknown>;
      };
      workout.poolLength = 50;
      workout.poolLengthUnit = "meters";
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(workoutMsg).toBeDefined();
    expect(workoutMsg.poolLengthUnit).toBe(0);
  });

  it("should omit poolLength when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        poolLength?: number;
        poolLengthUnit?: "meters";
        steps: Array<unknown>;
      };
      workout.poolLength = undefined;
      workout.poolLengthUnit = undefined;
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
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
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
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
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; equipment: string } | undefined;

    // Assert
    expect(stepMsg?.equipment).toBe("swimFins");
  });

  it("should preserve exact equipment values through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const equipmentValues = [
      { krd: "swim_fins", fit: "swimFins" },
      { krd: "swim_kickboard", fit: "swimKickboard" },
      { krd: "swim_paddles", fit: "swimPaddles" },
      { krd: "swim_pull_buoy", fit: "swimPullBuoy" },
      { krd: "swim_snorkel", fit: "swimSnorkel" },
    ];

    // Assert
    for (const equipment of equipmentValues) {
      const krd = await reader(originalBuffer);

      // Set equipment
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
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

      const messages = convertKRDToMessages(krd, logger);

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
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
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
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(stepMsg).not.toHaveProperty("equipment");
  });

  it("should preserve equipment on multiple steps", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const equipmentArray = [
      { krd: "swim_fins", fit: "swimFins" },
      { krd: "swim_kickboard", fit: "swimKickboard" },
      { krd: "swim_paddles", fit: "swimPaddles" },
      { krd: "none", fit: "none" },
    ];
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
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

    // Act
    const messages = convertKRDToMessages(krd, logger);

    // Assert
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
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const testPoolLength = 50;
    const testEquipment = "swim_fins";
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
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
    const messages = convertKRDToMessages(krd, logger);
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as
      | { mesgNum: number; poolLength: number; poolLengthUnit: number }
      | undefined;
    expect(workoutMsg).toBeDefined();
    expect(workoutMsg.poolLength).toBe(testPoolLength);
    expect(workoutMsg.poolLengthUnit).toBe(0);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; equipment: string } | undefined;

    // Assert
    expect(stepMsg?.equipment).toBe("swimFins");
  });
});

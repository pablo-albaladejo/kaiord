import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";

const FIXTURE_CALORIES_DEFAULT = 250;
const FIXTURE_CALORIES_HUNDRED = 100;
const FIXTURE_CALORIES_FIVE_HUNDRED = 500;
const FIXTURE_CALORIES_THOUSAND = 1000;
const FIXTURE_CALORIES_TWO_HUNDRED = 200;
const FIXTURE_POWER_WATTS_LOW = 150;
const FIXTURE_POWER_WATTS_DEFAULT = 200;
const FIXTURE_POWER_WATTS_LOW_MID = 180;
const FIXTURE_POWER_WATTS_MID = 250;
const FIXTURE_POWER_WATTS_HIGH = 300;
const FIXTURE_POWER_WATTS_HIGHEST = 350;
const FIXTURE_POWER_TOLERANCE_W = 1;
const FIXTURE_MIN_STEPS_FOR_COMBINED = 3;

describe("Round-trip: Advanced duration types - calorie duration", () => {
  it("should preserve calorie duration through KRD → FIT conversion", async () => {
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
          durationType: string;
          duration: { type: string; calories?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].durationType = "calories";
        workout.steps[0].duration = {
          type: "calories",
          calories: FIXTURE_CALORIES_DEFAULT,
        };
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
    expect(stepMsg?.durationType).toBe("calories");
    expect(stepMsg?.durationCalories).toBe(FIXTURE_CALORIES_DEFAULT);
  });

  it("should preserve exact calorie values through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const calorieValues = [
      FIXTURE_CALORIES_HUNDRED,
      FIXTURE_CALORIES_DEFAULT,
      FIXTURE_CALORIES_FIVE_HUNDRED,
      FIXTURE_CALORIES_THOUSAND,
    ];

    // Assert
    for (const calories of calorieValues) {
      const krd = await reader(originalBuffer);

      // Set calorie duration
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
          name?: string;
          sport: string;
          steps: Array<{
            stepIndex: number;
            durationType: string;
            duration: { type: string; calories?: number };
            [key: string]: unknown;
          }>;
        };
        if (workout.steps.length > 0) {
          workout.steps[0].durationType = "calories";
          workout.steps[0].duration = { type: "calories", calories };
        }
      }

      const messages = convertKRDToMessages(krd, logger);

      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === 0
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      expect(stepMsg?.durationCalories).toBe(calories);
    }
  });
});

describe("Round-trip: Advanced duration types - power duration", () => {
  it("should preserve power_less_than duration through round-trip", async () => {
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
          durationType: string;
          duration: { type: string; watts?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].durationType = "power_less_than";
        workout.steps[0].duration = {
          type: "power_less_than",
          watts: FIXTURE_POWER_WATTS_DEFAULT,
        };
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
    expect(stepMsg?.durationType).toBe("powerLessThan");
    expect(stepMsg?.durationPower).toBe(FIXTURE_POWER_WATTS_DEFAULT);
  });

  it("should preserve power_greater_than duration through round-trip", async () => {
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
          durationType: string;
          duration: { type: string; watts?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].durationType = "power_greater_than";
        workout.steps[0].duration = {
          type: "power_greater_than",
          watts: FIXTURE_POWER_WATTS_HIGH,
        };
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
    expect(stepMsg?.durationType).toBe("powerGreaterThan");
    expect(stepMsg?.durationPower).toBe(FIXTURE_POWER_WATTS_HIGH);
  });

  it("should preserve power values within ±1W tolerance", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const powerValues = [
      FIXTURE_POWER_WATTS_LOW,
      FIXTURE_POWER_WATTS_DEFAULT,
      FIXTURE_POWER_WATTS_MID,
      FIXTURE_POWER_WATTS_HIGH,
      FIXTURE_POWER_WATTS_HIGHEST,
    ];

    // Assert
    for (const watts of powerValues) {
      const krd = await reader(originalBuffer);

      // Set power duration
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
          name?: string;
          sport: string;
          steps: Array<{
            stepIndex: number;
            durationType: string;
            duration: { type: string; watts?: number };
            [key: string]: unknown;
          }>;
        };
        if (workout.steps.length > 0) {
          workout.steps[0].durationType = "power_less_than";
          workout.steps[0].duration = { type: "power_less_than", watts };
        }
      }

      const messages = convertKRDToMessages(krd, logger);

      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === 0
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      const actualValue = stepMsg?.durationPower as number;
      expect(Math.abs(actualValue - watts)).toBeLessThanOrEqual(
        FIXTURE_POWER_TOLERANCE_W
      );
    }
  });
});

describe("Round-trip: Repeat step conditionals - calories", () => {
  it("should preserve repeat_until_calories conditional through round-trip", async () => {
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
          durationType: string;
          duration: { type: string; calories?: number; repeatFrom?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].durationType = "repeat_until_calories";
        workout.steps[0].duration = {
          type: "repeat_until_calories",
          calories: FIXTURE_CALORIES_FIVE_HUNDRED,
          repeatFrom: 0,
        };
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
    expect(stepMsg?.durationType).toBe("repeatUntilCalories");
    expect(stepMsg?.durationCalories).toBe(FIXTURE_CALORIES_FIVE_HUNDRED);
    expect(stepMsg?.durationStep).toBe(0);
  });
});

describe("Round-trip: Repeat step conditionals - power conditionals", () => {
  it("should preserve repeat_until_power_less_than conditional", async () => {
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
          durationType: string;
          duration: { type: string; watts?: number; repeatFrom?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].durationType = "repeat_until_power_less_than";
        workout.steps[0].duration = {
          type: "repeat_until_power_less_than",
          watts: FIXTURE_POWER_WATTS_LOW_MID,
          repeatFrom: 0,
        };
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
    expect(stepMsg?.durationType).toBe("repeatUntilPowerLessThan");
    expect(stepMsg?.durationPower).toBe(FIXTURE_POWER_WATTS_LOW_MID);
    expect(stepMsg?.durationStep).toBe(0);
  });

  it("should preserve repeat_until_power_greater_than conditional", async () => {
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
          durationType: string;
          duration: { type: string; watts?: number; repeatFrom?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].durationType = "repeat_until_power_greater_than";
        workout.steps[0].duration = {
          type: "repeat_until_power_greater_than",
          watts: FIXTURE_POWER_WATTS_MID,
          repeatFrom: 0,
        };
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
    expect(stepMsg?.durationType).toBe("repeatUntilPowerGreaterThan");
    expect(stepMsg?.durationPower).toBe(FIXTURE_POWER_WATTS_MID);
    expect(stepMsg?.durationStep).toBe(0);
  });

  it("should preserve power conditional values within ±1W tolerance", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const powerValues = [
      FIXTURE_POWER_WATTS_LOW,
      FIXTURE_POWER_WATTS_DEFAULT,
      FIXTURE_POWER_WATTS_MID,
      FIXTURE_POWER_WATTS_HIGH,
    ];

    // Assert
    for (const watts of powerValues) {
      const krd = await reader(originalBuffer);

      // Set power conditional
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
          name?: string;
          sport: string;
          steps: Array<{
            stepIndex: number;
            durationType: string;
            duration: { type: string; watts?: number; repeatFrom?: number };
            [key: string]: unknown;
          }>;
        };
        if (workout.steps.length > 0) {
          workout.steps[0].durationType = "repeat_until_power_less_than";
          workout.steps[0].duration = {
            type: "repeat_until_power_less_than",
            watts,
            repeatFrom: 0,
          };
        }
      }

      const messages = convertKRDToMessages(krd, logger);

      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === 0
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      const actualValue = stepMsg?.durationPower as number;
      expect(Math.abs(actualValue - watts)).toBeLessThanOrEqual(
        FIXTURE_POWER_TOLERANCE_W
      );
    }
  });
});

describe("Round-trip: Combined advanced duration types", () => {
  it("should preserve multiple advanced duration types in same workout", async () => {
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
          durationType: string;
          duration: { type: string; calories?: number; watts?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length >= FIXTURE_MIN_STEPS_FOR_COMBINED) {
        // Step 0: calorie duration
        workout.steps[0].durationType = "calories";
        workout.steps[0].duration = {
          type: "calories",
          calories: FIXTURE_CALORIES_TWO_HUNDRED,
        };

        // Step 1: power_less_than duration
        workout.steps[1].durationType = "power_less_than";
        workout.steps[1].duration = {
          type: "power_less_than",
          watts: FIXTURE_POWER_WATTS_LOW_MID,
        };

        // Step 2: power_greater_than duration
        workout.steps[2].durationType = "power_greater_than";
        workout.steps[2].duration = {
          type: "power_greater_than",
          watts: FIXTURE_POWER_WATTS_MID,
        };
      }
    }
    const messages = convertKRDToMessages(krd, logger);
    const step0 = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;
    const step1 = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 1
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Act
    const step2 = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 2
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(step0?.durationType).toBe("calories");
    expect(step0?.durationCalories).toBe(FIXTURE_CALORIES_TWO_HUNDRED);
    expect(step1?.durationType).toBe("powerLessThan");
    expect(step1?.durationPower).toBe(FIXTURE_POWER_WATTS_LOW_MID);
    expect(step2?.durationType).toBe("powerGreaterThan");
    expect(step2?.durationPower).toBe(FIXTURE_POWER_WATTS_MID);
  });
});

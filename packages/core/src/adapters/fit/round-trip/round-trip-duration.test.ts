import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";

describe("Round-trip: Advanced duration types - calorie duration", () => {
  it("should preserve calorie duration through KRD → FIT conversion", async () => {
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

    // Set calorie duration on first step
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
        workout.steps[0].duration = { type: "calories", calories: 250 };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(stepMsg?.workoutStepMesg.durationType).toBe("calories");
    expect(stepMsg?.workoutStepMesg.durationCalories).toBe(250);
  });

  it("should preserve exact calorie values through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);
    const calorieValues = [100, 250, 500, 1000];

    for (const calories of calorieValues) {
      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Set calorie duration
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert - Exact value preservation
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      expect(stepMsg?.workoutStepMesg.durationCalories).toBe(calories);
    }
  });
});

describe("Round-trip: Advanced duration types - power duration", () => {
  it("should preserve power_less_than duration through round-trip", async () => {
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

    // Set power_less_than duration
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
        workout.steps[0].duration = { type: "power_less_than", watts: 200 };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(stepMsg?.workoutStepMesg.durationType).toBe("powerLessThan");
    expect(stepMsg?.workoutStepMesg.durationPower).toBe(200);
  });

  it("should preserve power_greater_than duration through round-trip", async () => {
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

    // Set power_greater_than duration
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
        workout.steps[0].duration = { type: "power_greater_than", watts: 300 };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(stepMsg?.workoutStepMesg.durationType).toBe("powerGreaterThan");
    expect(stepMsg?.workoutStepMesg.durationPower).toBe(300);
  });

  it("should preserve power values within ±1W tolerance", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);
    const powerValues = [150, 200, 250, 300, 350];

    for (const watts of powerValues) {
      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Set power duration
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert - Within ±1W tolerance
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      const actualValue = stepMsg?.workoutStepMesg.durationPower as number;
      expect(Math.abs(actualValue - watts)).toBeLessThanOrEqual(1);
    }
  });
});

describe("Round-trip: Repeat step conditionals - calories", () => {
  it("should preserve repeat_until_calories conditional through round-trip", async () => {
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

    // Set repeat_until_calories duration on first step
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
          calories: 500,
          repeatFrom: 0,
        };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(stepMsg?.workoutStepMesg.durationType).toBe("repeatUntilCalories");
    expect(stepMsg?.workoutStepMesg.durationCalories).toBe(500);
    expect(stepMsg?.workoutStepMesg.durationStep).toBe(0);
  });
});

describe("Round-trip: Repeat step conditionals - power conditionals", () => {
  it("should preserve repeat_until_power_less_than conditional", async () => {
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

    // Set power conditional
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
          watts: 180,
          repeatFrom: 0,
        };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(stepMsg?.workoutStepMesg.durationType).toBe(
      "repeatUntilPowerLessThan"
    );
    expect(stepMsg?.workoutStepMesg.durationPower).toBe(180);
    expect(stepMsg?.workoutStepMesg.durationStep).toBe(0);
  });

  it("should preserve repeat_until_power_greater_than conditional", async () => {
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

    // Set power conditional
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
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
          watts: 250,
          repeatFrom: 0,
        };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(stepMsg?.workoutStepMesg.durationType).toBe(
      "repeatUntilPowerGreaterThan"
    );
    expect(stepMsg?.workoutStepMesg.durationPower).toBe(250);
    expect(stepMsg?.workoutStepMesg.durationStep).toBe(0);
  });

  it("should preserve power conditional values within ±1W tolerance", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const fitPath = join(
      __dirname,
      "../../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
    );
    const originalBuffer = readFileSync(fitPath);
    const powerValues = [150, 200, 250, 300];

    for (const watts of powerValues) {
      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Set power conditional
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert - Within ±1W tolerance
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      const actualValue = stepMsg?.workoutStepMesg.durationPower as number;
      expect(Math.abs(actualValue - watts)).toBeLessThanOrEqual(1);
    }
  });
});

describe("Round-trip: Combined advanced duration types", () => {
  it("should preserve multiple advanced duration types in same workout", async () => {
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

    // Set different duration types on different steps
    if (krd.extensions?.workout) {
      const workout = krd.extensions.workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          durationType: string;
          duration: { type: string; calories?: number; watts?: number };
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length >= 3) {
        // Step 0: calorie duration
        workout.steps[0].durationType = "calories";
        workout.steps[0].duration = { type: "calories", calories: 200 };

        // Step 1: power_less_than duration
        workout.steps[1].durationType = "power_less_than";
        workout.steps[1].duration = { type: "power_less_than", watts: 180 };

        // Step 2: power_greater_than duration
        workout.steps[2].durationType = "power_greater_than";
        workout.steps[2].duration = { type: "power_greater_than", watts: 250 };
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check all steps have correct duration types
    const step0 = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 0
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    const step1 = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 1
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    const step2 = messages.find(
      (msg: unknown) =>
        (msg as { type: string }).type === "workoutStepMesgs" &&
        (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
          .messageIndex === 2
    ) as { type: string; workoutStepMesg: Record<string, unknown> } | undefined;

    expect(step0?.workoutStepMesg.durationType).toBe("calories");
    expect(step0?.workoutStepMesg.durationCalories).toBe(200);

    expect(step1?.workoutStepMesg.durationType).toBe("powerLessThan");
    expect(step1?.workoutStepMesg.durationPower).toBe(180);

    expect(step2?.workoutStepMesg.durationType).toBe("powerGreaterThan");
    expect(step2?.workoutStepMesg.durationPower).toBe(250);
  });
});

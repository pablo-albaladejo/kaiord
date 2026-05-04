import { createToleranceChecker } from "@kaiord/core";
import { createMockLogger, loadZwoFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

describe("Zwift Round-trip: WorkoutIndividualSteps.zwo", () => {
  it(
    "should preserve workout through Zwift → KRD → Zwift conversion",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
      const krd = await reader(originalXml);
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("structured_workout");
      expect(krd.metadata.sport).toBe("cycling");
      expect(krd.extensions?.structured_workout).toBeDefined();
      const workout = krd.extensions?.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.steps).toBeDefined();
      expect(workout.steps.length).toBeGreaterThan(0);
      const convertedXml = await writer(krd);
      expect(convertedXml).toContain("<?xml");
      expect(convertedXml).toContain("workout_file");
      const krd2 = await reader(convertedXml);
      expect(krd2.metadata.sport).toBe(krd.metadata.sport);

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };

      // Assert
      expect(workout2.steps.length).toBe(workout.steps.length);
    }
  );

  it(
    "should preserve duration values within tolerance",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          duration: { type: string; seconds?: number; meters?: number };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          duration: { type: string; seconds?: number; meters?: number };
        }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        if (step1.duration.type === "time" && step2.duration.type === "time") {
          const violation = toleranceChecker.checkTime(
            step1.duration.seconds!,
            step2.duration.seconds!
          );
          expect(violation).toBeNull();
        }

        if (
          step1.duration.type === "distance" &&
          step2.duration.type === "distance"
        ) {
          const violation = toleranceChecker.checkDistance(
            step1.duration.meters!,
            step2.duration.meters!
          );
          expect(violation).toBeNull();
        }
      }
    }
  );

  it(
    "should preserve power target values within tolerance",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: {
              unit: string;
              value?: number;
              min?: number;
              max?: number;
            };
          };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: {
              unit: string;
              value?: number;
              min?: number;
              max?: number;
            };
          };
        }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        if (
          step1.target.type === "power" &&
          step2.target.type === "power" &&
          step1.target.value?.unit === "percent_ftp" &&
          step2.target.value?.unit === "percent_ftp"
        ) {
          if (step1.target.value.value !== undefined) {
            const violation = toleranceChecker.checkPower(
              step1.target.value.value,
              step2.target.value.value!
            );
            expect(violation).toBeNull();
          }

          if (
            step1.target.value.min !== undefined &&
            step1.target.value.max !== undefined
          ) {
            const minViolation = toleranceChecker.checkPower(
              step1.target.value.min,
              step2.target.value.min!
            );
            const maxViolation = toleranceChecker.checkPower(
              step1.target.value.max,
              step2.target.value.max!
            );
            expect(minViolation).toBeNull();
            expect(maxViolation).toBeNull();
          }
        }
      }
    }
  );

  it("should preserve interval types", { timeout: 30_000 }, async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdZwiftValidator(logger);
    const reader = createFastXmlZwiftReader(logger, validator);
    const writer = createFastXmlZwiftWriter(logger, validator);
    const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const krd = await reader(originalXml);
    const convertedXml = await writer(krd);
    const krd2 = await reader(convertedXml);
    const workout = krd.extensions?.structured_workout as {
      steps: Array<{ intensity?: string }>;
    };

    // Act
    const workout2 = krd2.extensions?.structured_workout as {
      steps: Array<{ intensity?: string }>;
    };

    // Assert
    for (let i = 0; i < workout.steps.length; i++) {
      expect(workout2.steps[i].intensity).toBe(workout.steps[i].intensity);
    }
  });
});

describe("Zwift Round-trip: WorkoutRepeatSteps.zwo", () => {
  it(
    "should preserve repetition blocks through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutRepeatSteps.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{ repeatCount?: number; steps?: Array<unknown> }>;
      };
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{ repeatCount?: number; steps?: Array<unknown> }>;
      };
      const repBlocks = workout.steps.filter(
        (s) => s.repeatCount !== undefined
      );

      // Act
      const repBlocks2 = workout2.steps.filter(
        (s) => s.repeatCount !== undefined
      );

      // Assert
      expect(repBlocks2.length).toBe(repBlocks.length);
      for (let i = 0; i < repBlocks.length; i++) {
        expect(repBlocks2[i].repeatCount).toBe(repBlocks[i].repeatCount);
        expect(repBlocks2[i].steps?.length).toBe(repBlocks[i].steps?.length);
      }
    }
  );

  it(
    "should preserve nested step data in repetition blocks",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutRepeatSteps.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          repeatCount?: number;
          steps?: Array<{
            duration: { type: string; seconds?: number };
            target: { type: string; value?: { value?: number } };
          }>;
        }>;
      };
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          repeatCount?: number;
          steps?: Array<{
            duration: { type: string; seconds?: number };
            target: { type: string; value?: { value?: number } };
          }>;
        }>;
      };
      const repBlocks = workout.steps.filter(
        (s) => s.repeatCount !== undefined
      );

      // Act
      const repBlocks2 = workout2.steps.filter(
        (s) => s.repeatCount !== undefined
      );

      // Assert
      for (let i = 0; i < repBlocks.length; i++) {
        const block1 = repBlocks[i];
        const block2 = repBlocks2[i];

        if (block1.steps && block2.steps) {
          for (let j = 0; j < block1.steps.length; j++) {
            const step1 = block1.steps[j];
            const step2 = block2.steps[j];

            // Check duration
            if (
              step1.duration.type === "time" &&
              step2.duration.type === "time"
            ) {
              const violation = toleranceChecker.checkTime(
                step1.duration.seconds!,
                step2.duration.seconds!
              );
              expect(violation).toBeNull();
            }

            // Check target
            if (
              step1.target.type === "power" &&
              step2.target.type === "power" &&
              step1.target.value?.value !== undefined
            ) {
              const violation = toleranceChecker.checkPower(
                step1.target.value.value,
                step2.target.value?.value ?? 0
              );
              expect(violation).toBeNull();
            }
          }
        }
      }
    }
  );
});

describe("Zwift Round-trip: WorkoutCustomTargetValues.zwo", () => {
  it(
    "should preserve custom target values through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutCustomTargetValues.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: {
              unit: string;
              value?: number;
              min?: number;
              max?: number;
            };
          };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: {
              unit: string;
              value?: number;
              min?: number;
              max?: number;
            };
          };
        }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        // Target type preserved
        expect(step2.target.type).toBe(step1.target.type);

        // Check power targets
        if (step1.target.type === "power" && step1.target.value) {
          expect(step2.target.value?.unit).toBe(step1.target.value.unit);

          if (step1.target.value.value !== undefined) {
            const violation = toleranceChecker.checkPower(
              step1.target.value.value,
              step2.target.value?.value ?? 0
            );
            expect(violation).toBeNull();
          }

          if (
            step1.target.value.min !== undefined &&
            step1.target.value.max !== undefined
          ) {
            const minViolation = toleranceChecker.checkPower(
              step1.target.value.min,
              step2.target.value?.min ?? 0
            );
            const maxViolation = toleranceChecker.checkPower(
              step1.target.value.max,
              step2.target.value?.max ?? 0
            );
            expect(minViolation).toBeNull();
            expect(maxViolation).toBeNull();
          }
        }

        // Check cadence targets
        if (step1.target.type === "cadence" && step1.target.value) {
          if (step1.target.value.value !== undefined) {
            const violation = toleranceChecker.checkCadence(
              step1.target.value.value,
              step2.target.value?.value ?? 0
            );
            expect(violation).toBeNull();
          }
        }

        // Check pace targets
        if (step1.target.type === "pace" && step1.target.value) {
          if (step1.target.value.value !== undefined) {
            const violation = toleranceChecker.checkPace(
              step1.target.value.value,
              step2.target.value?.value ?? 0
            );
            expect(violation).toBeNull();
          }
        }
      }
    }
  );

  it(
    "should preserve cadence values within ±1 rpm tolerance",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutCustomTargetValues.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          target: { type: string; value?: { value?: number } };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          target: { type: string; value?: { value?: number } };
        }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        if (
          step1.target.type === "cadence" &&
          step1.target.value?.value !== undefined
        ) {
          const violation = toleranceChecker.checkCadence(
            step1.target.value.value,
            step2.target.value?.value ?? 0
          );
          expect(violation).toBeNull();
        }
      }
    }
  );
});

describe("Zwift Round-trip: Extensions preservation", () => {
  it(
    "should preserve Zwift extensions through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const zwiftExt = krd.extensions?.zwift as Record<string, unknown>;

      // Act
      const zwiftExt2 = krd2.extensions?.zwift as Record<string, unknown>;

      // Assert
      expect(zwiftExt2.author).toBe(zwiftExt.author);
      expect(zwiftExt2.description).toBe(zwiftExt.description);
      expect(zwiftExt2.durationType).toBe(zwiftExt.durationType);
      if (zwiftExt.tags) {
        expect(zwiftExt2.tags).toBeDefined();
      }
    }
  );

  it(
    "should preserve text events through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{ notes?: string }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{ notes?: string }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        if (workout.steps[i].notes) {
          expect(workout2.steps[i].notes).toBe(workout.steps[i].notes);
        }
      }
    }
  );
});

describe("Zwift Round-trip: KRD → Zwift → KRD", () => {
  it(
    "should preserve KRD through KRD → Zwift → KRD conversion",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
      const originalKrd = await reader(originalXml);
      const zwiftXml = await writer(originalKrd);
      const convertedKrd = await reader(zwiftXml);
      expect(convertedKrd.metadata.sport).toBe(originalKrd.metadata.sport);
      const workout1 = originalKrd.extensions?.structured_workout as {
        steps: Array<{
          duration: { type: string; seconds?: number };
          target: { type: string; value?: { value?: number } };
        }>;
      };

      // Act
      const workout2 = convertedKrd.extensions?.structured_workout as {
        steps: Array<{
          duration: { type: string; seconds?: number };
          target: { type: string; value?: { value?: number } };
        }>;
      };

      // Assert
      expect(workout2.steps.length).toBe(workout1.steps.length);
      for (let i = 0; i < workout1.steps.length; i++) {
        const step1 = workout1.steps[i];
        const step2 = workout2.steps[i];

        // Duration
        if (step1.duration.type === "time" && step2.duration.type === "time") {
          const violation = toleranceChecker.checkTime(
            step1.duration.seconds!,
            step2.duration.seconds!
          );
          expect(violation).toBeNull();
        }

        // Target
        if (
          step1.target.type === "power" &&
          step2.target.type === "power" &&
          step1.target.value?.value !== undefined
        ) {
          const violation = toleranceChecker.checkPower(
            step1.target.value.value,
            step2.target.value?.value ?? 0
          );
          expect(violation).toBeNull();
        }
      }
    }
  );
});

describe("Zwift Round-trip: WorkoutRepeatGreaterThanStep.zwo", () => {
  it(
    "should preserve advanced duration types through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutRepeatGreaterThanStep.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          durationType: string;
          duration: { type: string };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          durationType: string;
          duration: { type: string };
        }>;
      };

      // Assert
      expect(workout2.steps.length).toBe(workout.steps.length);
      for (let i = 0; i < workout.steps.length; i++) {
        expect(workout2.steps[i].durationType).toBe(
          workout.steps[i].durationType
        );
        expect(workout2.steps[i].duration.type).toBe(
          workout.steps[i].duration.type
        );
      }
    }
  );

  it(
    "should preserve heart rate targets through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const toleranceChecker = createToleranceChecker();
      const originalXml = loadZwoFixture("WorkoutRepeatGreaterThanStep.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; value?: number; zone?: number };
          };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; value?: number; zone?: number };
          };
        }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        if (
          step1.target.type === "heart_rate" &&
          step2.target.type === "heart_rate"
        ) {
          expect(step2.target.value?.unit).toBe(step1.target.value?.unit);

          if (step1.target.value?.value !== undefined) {
            const violation = toleranceChecker.checkHeartRate(
              step1.target.value.value,
              step2.target.value?.value ?? 0
            );
            expect(violation).toBeNull();
          }

          if (step1.target.value?.zone !== undefined) {
            expect(step2.target.value?.zone).toBe(step1.target.value.zone);
          }
        }
      }
    }
  );

  it(
    "should preserve power zones through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutRepeatGreaterThanStep.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const workout = krd.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; zone?: number };
          };
        }>;
      };

      // Act
      const workout2 = krd2.extensions?.structured_workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; zone?: number };
          };
        }>;
      };

      // Assert
      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        if (
          step1.target.type === "power" &&
          step2.target.type === "power" &&
          step1.target.value?.unit === "zone"
        ) {
          expect(step2.target.value?.unit).toBe("zone");
          expect(step2.target.value?.zone).toBe(step1.target.value.zone);
        }
      }
    }
  );

  it(
    "should preserve FIT extensions through round-trip",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const originalXml = loadZwoFixture("WorkoutRepeatGreaterThanStep.zwo");
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);
      const fitExt = krd.extensions?.fit as Record<string, unknown> | undefined;

      // Act
      const fitExt2 = krd2.extensions?.fit as
        | Record<string, unknown>
        | undefined;

      // Assert
      if (fitExt) {
        expect(fitExt2).toBeDefined();
        expect(fitExt2?.timeCreated).toBe(fitExt.timeCreated);
        expect(fitExt2?.manufacturer).toBe(fitExt.manufacturer);
        expect(fitExt2?.product).toBe(fitExt.product);
        expect(fitExt2?.serialNumber).toBe(fitExt.serialNumber);
      }
    }
  );
});

describe("Zwift Round-trip: Complete validation", () => {
  it(
    "should pass complete round-trip validation for all fixtures",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);

      // Act
      const fixtures = [
        "WorkoutIndividualSteps.zwo",
        "WorkoutRepeatSteps.zwo",
        "WorkoutCustomTargetValues.zwo",
        "WorkoutRepeatGreaterThanStep.zwo",
      ];

      // Assert
      for (const fixture of fixtures) {
        const originalXml = loadZwoFixture(fixture);

        const krd = await reader(originalXml);
        const convertedXml = await writer(krd);
        const krd2 = await reader(convertedXml);

        expect(krd2.version).toBe(krd.version);
        expect(krd2.type).toBe(krd.type);
        expect(krd2.metadata.sport).toBe(krd.metadata.sport);

        const workout = krd.extensions?.structured_workout as {
          steps: Array<unknown>;
        };
        const workout2 = krd2.extensions?.structured_workout as {
          steps: Array<unknown>;
        };

        expect(workout2.steps.length).toBe(workout.steps.length);
      }
    }
  );
});

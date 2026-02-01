import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { createToleranceChecker } from "../../../domain/validation/tolerance-checker";
import { createMockLogger } from "../../../tests/helpers/test-utils";
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
      const toleranceChecker = createToleranceChecker();

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act - Zwift → KRD
      const krd = await reader(originalXml);

      // Assert - KRD structure
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("workout");
      expect(krd.metadata.sport).toBe("cycling");
      expect(krd.extensions?.workout).toBeDefined();

      const workout = krd.extensions?.workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.steps).toBeDefined();
      expect(workout.steps.length).toBeGreaterThan(0);

      // Act - KRD → Zwift
      const convertedXml = await writer(krd);

      // Assert - XML is valid
      expect(convertedXml).toContain("<?xml");
      expect(convertedXml).toContain("workout_file");

      // Act - Zwift → KRD (second round)
      const krd2 = await reader(convertedXml);

      // Assert - Workout metadata preserved
      expect(krd2.metadata.sport).toBe(krd.metadata.sport);

      const workout2 = krd2.extensions?.workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };

      // Assert - Step count preserved
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check duration values
      const workout = krd.extensions?.workout as {
        steps: Array<{
          duration: { type: string; seconds?: number; meters?: number };
        }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{
          duration: { type: string; seconds?: number; meters?: number };
        }>;
      };

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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check power target values
      const workout = krd.extensions?.workout as {
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
      const workout2 = krd2.extensions?.workout as {
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

    const zwiftPath = join(
      __dirname,
      "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
    );
    const originalXml = readFileSync(zwiftPath, "utf-8");

    // Act
    const krd = await reader(originalXml);
    const convertedXml = await writer(krd);
    const krd2 = await reader(convertedXml);

    // Assert - Check intensity values (interval types)
    const workout = krd.extensions?.workout as {
      steps: Array<{ intensity?: string }>;
    };
    const workout2 = krd2.extensions?.workout as {
      steps: Array<{ intensity?: string }>;
    };

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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutRepeatSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check repetition blocks
      const workout = krd.extensions?.workout as {
        steps: Array<{ repeatCount?: number; steps?: Array<unknown> }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{ repeatCount?: number; steps?: Array<unknown> }>;
      };

      // Find repetition blocks
      const repBlocks = workout.steps.filter(
        (s) => s.repeatCount !== undefined
      );
      const repBlocks2 = workout2.steps.filter(
        (s) => s.repeatCount !== undefined
      );

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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutRepeatSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check nested steps in repetition blocks
      const workout = krd.extensions?.workout as {
        steps: Array<{
          repeatCount?: number;
          steps?: Array<{
            duration: { type: string; seconds?: number };
            target: { type: string; value?: { value?: number } };
          }>;
        }>;
      };
      const workout2 = krd2.extensions?.workout as {
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
      const repBlocks2 = workout2.steps.filter(
        (s) => s.repeatCount !== undefined
      );

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
                step2.target.value?.value!
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutCustomTargetValues.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check all target types
      const workout = krd.extensions?.workout as {
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
      const workout2 = krd2.extensions?.workout as {
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
              step2.target.value?.value!
            );
            expect(violation).toBeNull();
          }

          if (
            step1.target.value.min !== undefined &&
            step1.target.value.max !== undefined
          ) {
            const minViolation = toleranceChecker.checkPower(
              step1.target.value.min,
              step2.target.value?.min!
            );
            const maxViolation = toleranceChecker.checkPower(
              step1.target.value.max,
              step2.target.value?.max!
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
              step2.target.value?.value!
            );
            expect(violation).toBeNull();
          }
        }

        // Check pace targets
        if (step1.target.type === "pace" && step1.target.value) {
          if (step1.target.value.value !== undefined) {
            const violation = toleranceChecker.checkPace(
              step1.target.value.value,
              step2.target.value?.value!
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutCustomTargetValues.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check cadence values
      const workout = krd.extensions?.workout as {
        steps: Array<{
          target: { type: string; value?: { value?: number } };
        }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{
          target: { type: string; value?: { value?: number } };
        }>;
      };

      for (let i = 0; i < workout.steps.length; i++) {
        const step1 = workout.steps[i];
        const step2 = workout2.steps[i];

        if (
          step1.target.type === "cadence" &&
          step1.target.value?.value !== undefined
        ) {
          const violation = toleranceChecker.checkCadence(
            step1.target.value.value,
            step2.target.value?.value!
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check Zwift extensions
      const zwiftExt = krd.extensions?.zwift as Record<string, unknown>;
      const zwiftExt2 = krd2.extensions?.zwift as Record<string, unknown>;

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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check text events (notes)
      const workout = krd.extensions?.workout as {
        steps: Array<{ notes?: string }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{ notes?: string }>;
      };

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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act - Start with KRD
      const originalKrd = await reader(originalXml);

      // Act - KRD → Zwift
      const zwiftXml = await writer(originalKrd);

      // Act - Zwift → KRD
      const convertedKrd = await reader(zwiftXml);

      // Assert - Metadata preserved
      expect(convertedKrd.metadata.sport).toBe(originalKrd.metadata.sport);

      // Assert - Workout structure preserved
      const workout1 = originalKrd.extensions?.workout as {
        steps: Array<{
          duration: { type: string; seconds?: number };
          target: { type: string; value?: { value?: number } };
        }>;
      };
      const workout2 = convertedKrd.extensions?.workout as {
        steps: Array<{
          duration: { type: string; seconds?: number };
          target: { type: string; value?: { value?: number } };
        }>;
      };

      expect(workout2.steps.length).toBe(workout1.steps.length);

      // Assert - Step data preserved within tolerances
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
            step2.target.value?.value!
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutRepeatGreaterThanStep.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check workout structure
      const workout = krd.extensions?.workout as {
        steps: Array<{
          durationType: string;
          duration: { type: string };
        }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{
          durationType: string;
          duration: { type: string };
        }>;
      };

      expect(workout2.steps.length).toBe(workout.steps.length);

      // Assert - Check duration types preserved
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutRepeatGreaterThanStep.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check heart rate targets
      const workout = krd.extensions?.workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; value?: number; zone?: number };
          };
        }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; value?: number; zone?: number };
          };
        }>;
      };

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
              step2.target.value?.value!
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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutRepeatGreaterThanStep.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check power zones
      const workout = krd.extensions?.workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; zone?: number };
          };
        }>;
      };
      const workout2 = krd2.extensions?.workout as {
        steps: Array<{
          target: {
            type: string;
            value?: { unit: string; zone?: number };
          };
        }>;
      };

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

      const zwiftPath = join(
        __dirname,
        "../../../tests/fixtures/zwift-files/WorkoutRepeatGreaterThanStep.zwo"
      );
      const originalXml = readFileSync(zwiftPath, "utf-8");

      // Act
      const krd = await reader(originalXml);
      const convertedXml = await writer(krd);
      const krd2 = await reader(convertedXml);

      // Assert - Check FIT extensions preserved
      const fitExt = krd.extensions?.fit as Record<string, unknown> | undefined;
      const fitExt2 = krd2.extensions?.fit as
        | Record<string, unknown>
        | undefined;

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

      const fixtures = [
        "WorkoutIndividualSteps.zwo",
        "WorkoutRepeatSteps.zwo",
        "WorkoutCustomTargetValues.zwo",
        "WorkoutRepeatGreaterThanStep.zwo",
      ];

      for (const fixture of fixtures) {
        // Act
        const zwiftPath = join(
          __dirname,
          `../../../tests/fixtures/zwift-files/${fixture}`
        );
        const originalXml = readFileSync(zwiftPath, "utf-8");

        const krd = await reader(originalXml);
        const convertedXml = await writer(krd);
        const krd2 = await reader(convertedXml);

        // Assert - Basic structure preserved
        expect(krd2.version).toBe(krd.version);
        expect(krd2.type).toBe(krd.type);
        expect(krd2.metadata.sport).toBe(krd.metadata.sport);

        const workout = krd.extensions?.workout as { steps: Array<unknown> };
        const workout2 = krd2.extensions?.workout as { steps: Array<unknown> };

        expect(workout2.steps.length).toBe(workout.steps.length);
      }
    }
  );
});

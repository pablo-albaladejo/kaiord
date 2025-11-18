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

describe("Round-trip: Zwift → KRD → Zwift", () => {
  it("should preserve SteadyState intervals through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdZwiftValidator(logger);
    const reader = createFastXmlZwiftReader(logger, validator);
    const writer = createFastXmlZwiftWriter(logger, validator);
    const toleranceChecker = createToleranceChecker();
    const zwoPath = join(
      __dirname,
      "../../../tests/fixtures/zwift-files/WorkoutIndividualSteps.zwo"
    );
    const originalXml = readFileSync(zwoPath, "utf-8");

    // Act - Zwift → KRD → Zwift → KRD
    const krd1 = await reader(originalXml);
    const convertedXml = await writer(krd1);
    const krd2 = await reader(convertedXml);

    // Assert - Compare workout structures
    const workout1 = krd1.extensions?.workout as {
      name?: string;
      sport: string;
      steps: Array<{
        stepIndex: number;
        durationType: string;
        duration: { type: string; seconds?: number };
        targetType: string;
        target: {
          type: string;
          value: { unit: string; value?: number };
        };
      }>;
    };

    const workout2 = krd2.extensions?.workout as {
      name?: string;
      sport: string;
      steps: Array<{
        stepIndex: number;
        durationType: string;
        duration: { type: string; seconds?: number };
        targetType: string;
        target: {
          type: string;
          value: { unit: string; value?: number };
        };
      }>;
    };

    expect(workout2.name).toBe(workout1.name);
    expect(workout2.sport).toBe(workout1.sport);
    expect(workout2.steps.length).toBe(workout1.steps.length);

    // Check power targets with tolerance
    for (let i = 0; i < workout1.steps.length; i++) {
      const step1 = workout1.steps[i];
      const step2 = workout2.steps[i];

      expect(step2.durationType).toBe(step1.durationType);
      expect(step2.targetType).toBe(step1.targetType);

      // Check duration with tolerance
      if (step1.duration.seconds !== undefined) {
        const violation = toleranceChecker.checkTime(
          step1.duration.seconds,
          step2.duration.seconds!
        );
        expect(violation).toBeNull();
      }

      // Check power targets with tolerance
      if (
        step1.targetType === "power" &&
        step1.target.value.unit === "percent_ftp"
      ) {
        const violation = toleranceChecker.checkPower(
          step1.target.value.value!,
          step2.target.value.value!
        );
        expect(violation).toBeNull();
      }
    }
  });

  it("should preserve IntervalsT blocks through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdZwiftValidator(logger);
    const reader = createFastXmlZwiftReader(logger, validator);
    const writer = createFastXmlZwiftWriter(logger, validator);
    const toleranceChecker = createToleranceChecker();
    const zwoPath = join(
      __dirname,
      "../../../tests/fixtures/zwift-files/WorkoutRepeatSteps.zwo"
    );
    const originalXml = readFileSync(zwoPath, "utf-8");

    // Act - Zwift → KRD → Zwift → KRD
    const krd1 = await reader(originalXml);
    const convertedXml = await writer(krd1);
    const krd2 = await reader(convertedXml);

    // Assert - Check repetition blocks
    const workout1 = krd1.extensions?.workout as {
      steps: Array<
        | { stepIndex: number }
        | {
            repeatCount: number;
            steps: Array<{
              stepIndex: number;
              durationType: string;
              targetType: string;
              duration: { type: string; seconds?: number };
              target: {
                type: string;
                value: { unit: string; value?: number };
              };
            }>;
          }
      >;
    };

    const workout2 = krd2.extensions?.workout as {
      steps: Array<
        | { stepIndex: number }
        | {
            repeatCount: number;
            steps: Array<{
              stepIndex: number;
              durationType: string;
              targetType: string;
              duration: { type: string; seconds?: number };
              target: {
                type: string;
                value: { unit: string; value?: number };
              };
            }>;
          }
      >;
    };

    expect(workout2.steps.length).toBe(workout1.steps.length);

    // Find and compare repetition blocks
    for (let i = 0; i < workout1.steps.length; i++) {
      const step1 = workout1.steps[i];
      const step2 = workout2.steps[i];

      if ("repeatCount" in step1 && "repeatCount" in step2) {
        expect(step2.repeatCount).toBe(step1.repeatCount);
        expect(step2.steps.length).toBe(step1.steps.length);

        // Check nested steps with tolerance
        for (let j = 0; j < step1.steps.length; j++) {
          const nestedStep1 = step1.steps[j];
          const nestedStep2 = step2.steps[j];

          expect(nestedStep2.durationType).toBe(nestedStep1.durationType);
          expect(nestedStep2.targetType).toBe(nestedStep1.targetType);

          // Check duration with tolerance
          if (nestedStep1.duration.seconds !== undefined) {
            const violation = toleranceChecker.checkTime(
              nestedStep1.duration.seconds,
              nestedStep2.duration.seconds!
            );
            expect(violation).toBeNull();
          }

          // Check power with tolerance
          if (
            nestedStep1.targetType === "power" &&
            nestedStep1.target.value.unit === "percent_ftp"
          ) {
            const violation = toleranceChecker.checkPower(
              nestedStep1.target.value.value!,
              nestedStep2.target.value.value!
            );
            expect(violation).toBeNull();
          }
        }
      }
    }
  });
});

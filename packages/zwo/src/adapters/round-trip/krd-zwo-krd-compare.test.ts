import type { Logger } from "@kaiord/core";
import { compareKRDs, createToleranceChecker } from "@kaiord/core";
import {
  createMockLogger,
  loadKrdFixture,
  loadZwoFixture,
} from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

const validator = createXsdZwiftValidator(createMockLogger());

type FormatLimit = { field: string; warning: string };

// Zwift has no conditional repeat: a FIT "repeat until HR > x" step is written
// as a fixed 300 s block and the writer warns. That is the only documented
// limit hit by the fixtures; any other violation is a regression.
const FORMAT_LIMITS: Record<string, Array<FormatLimit>> = {
  "WorkoutCustomTargetValues.krd": [],
  "WorkoutIndividualSteps.krd": [],
  "WorkoutRepeatGreaterThanStep.krd": [
    {
      field: "structured_workout.steps[3].duration.type",
      warning: "Lossy conversion: unsupported duration type",
    },
  ],
  "WorkoutRepeatSteps.krd": [],
};

describe("Zwift Round-trip: KRD → ZWO → KRD compared step by step", () => {
  it.each(Object.keys(FORMAT_LIMITS))(
    "should report no step violation beyond the warned format limits for %s",
    { timeout: 30_000 },
    async (fixture) => {
      // Arrange
      const logger: Logger = { ...createMockLogger(), warn: vi.fn() };
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const krd1 = loadKrdFixture(fixture);
      const limits = FORMAT_LIMITS[fixture]!;

      // Act
      const krd2 = await reader(await writer(krd1));

      // Assert
      const checker = createToleranceChecker();
      const violations = compareKRDs(krd1, krd2, checker, logger);
      expect(violations.map((v) => v.field)).toStrictEqual(
        limits.map((limit) => limit.field)
      );
      for (const limit of limits) {
        expect(logger.warn).toHaveBeenCalledWith(
          limit.warning,
          expect.anything()
        );
      }
    }
  );
});

describe("Zwift fixture WorkoutRepeatSteps.zwo", () => {
  it("should hold the same steps, in the same order, as the FIT-derived KRD", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createFastXmlZwiftReader(logger, validator);
    const expected = loadKrdFixture("WorkoutRepeatSteps.krd");

    // Act
    const actual = await reader(loadZwoFixture("WorkoutRepeatSteps.zwo"));

    // Assert
    const checker = createToleranceChecker();
    expect(compareKRDs(expected, actual, checker, logger)).toStrictEqual([]);
  });
});

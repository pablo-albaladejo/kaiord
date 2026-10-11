import { compareKRDs, createToleranceChecker } from "@kaiord/core";
import { createMockLogger, loadZwoFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

const logger = createMockLogger();
const validator = createXsdZwiftValidator(logger);
const reader = createFastXmlZwiftReader(logger, validator);
const writer = createFastXmlZwiftWriter(logger, validator);

describe("Zwift Round-trip: ZWO → KRD → ZWO compared step by step", () => {
  it.each([
    "WorkoutCustomTargetValues.zwo",
    "WorkoutIndividualSteps.zwo",
    "WorkoutRepeatGreaterThanStep.zwo",
    "WorkoutRepeatSteps.zwo",
  ])(
    "should report no step violation for the round-trip of %s",
    { timeout: 30_000 },
    async (fixture) => {
      // Arrange
      const krd1 = await reader(loadZwoFixture(fixture));

      // Act
      const krd2 = await reader(await writer(krd1));

      // Assert
      const checker = createToleranceChecker();
      expect(compareKRDs(krd1, krd2, checker, logger)).toStrictEqual([]);
    }
  );
});

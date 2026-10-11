import { compareKRDs, createToleranceChecker } from "@kaiord/core";
import { createMockLogger, loadTcxFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../fast-xml-parser";
import { createXsdTcxValidator } from "../xsd-validator";

const logger = createMockLogger();
const reader = createFastXmlTcxReader(logger);
const writer = createFastXmlTcxWriter(logger, createXsdTcxValidator(logger));

describe("Round-trip: TCX → KRD → TCX compared step by step", () => {
  it.each([
    "WorkoutHeartRateTargets.tcx",
    "WorkoutMixedDurations.tcx",
    "WorkoutRepeatBlocks.tcx",
    "WorkoutSpeedTargets.tcx",
  ])(
    "should report no step violation for the round-trip of %s",
    async (fixture) => {
      // Arrange
      const krd1 = await reader(loadTcxFixture(fixture));

      // Act
      const krd2 = await reader(await writer(krd1));

      // Assert
      const checker = createToleranceChecker();
      expect(compareKRDs(krd1, krd2, checker, logger)).toStrictEqual([]);
    }
  );
});

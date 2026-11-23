/**
 * The TCX Round-trip, as the Kaiord SDK claims it: every workout case of the
 * TCX contract and every TCX workout fixture goes through the adapter's own
 * reader and writer, and every KRD value must come back within the declared
 * tolerances or be declared in `TCX_ROUND_TRIP`.
 */
import { TCX_ROUND_TRIP } from "@kaiord/core";
import {
  buildRecordedActivity,
  createMockLogger,
  loadTcxFixture,
  roundTripReport,
  unsupportedButCarried,
  unusedDeclarations,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../fast-xml-parser";
import { createXsdTcxValidator } from "../xsd-validator";

const logger = createMockLogger();
const codec = {
  read: createFastXmlTcxReader(logger),
  write: createFastXmlTcxWriter(logger, createXsdTcxValidator(logger)),
};
const fixtures = [
  "WorkoutHeartRateTargets.tcx",
  "WorkoutMixedDurations.tcx",
  "WorkoutRepeatBlocks.tcx",
  "WorkoutSpeedTargets.tcx",
].map((name) => ({ name, data: loadTcxFixture(name) }));

describe("Round-trip contract: TCX", () => {
  it(
    "should keep every value of every TCX workout within the declared tolerances",
    { timeout: 120_000 },
    async () => {
      // Arrange
      const contract = TCX_ROUND_TRIP;

      // Act
      const report = await roundTripReport(contract, codec, fixtures);

      // Assert
      expect(report.differences).toEqual([]);
      expect(unusedDeclarations(contract, report)).toEqual([]);
    }
  );

  it(
    "should not carry any kind of step the TCX contract declares unsupported",
    { timeout: 120_000 },
    async () => {
      // Arrange
      const contract = TCX_ROUND_TRIP;

      // Act
      const carried = await unsupportedButCarried(contract, codec);

      // Assert
      expect(carried).toEqual([]);
    }
  );

  it("should refuse to write a recorded activity, which no TCX Round-trip covers", async () => {
    // Arrange
    const activity = buildRecordedActivity();

    // Act
    const written = codec.write(activity);

    // Assert
    await expect(written).rejects.toThrow();
  });
});

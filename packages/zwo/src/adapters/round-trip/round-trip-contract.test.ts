/**
 * The ZWO Round-trip, as the Kaiord SDK claims it: every workout case of the
 * ZWO contract and every ZWO workout fixture goes through the adapter's own
 * reader and writer, and every KRD value must come back within the declared
 * tolerances or be declared in `ZWO_ROUND_TRIP`.
 */
import { ZWO_ROUND_TRIP } from "@kaiord/core";
import {
  buildRecordedActivity,
  createMockLogger,
  loadZwoFixture,
  roundTripReport,
  unsupportedButCarried,
  unusedDeclarations,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

const logger = createMockLogger();
const validator = createXsdZwiftValidator(logger);
const codec = {
  read: createFastXmlZwiftReader(logger, validator),
  write: createFastXmlZwiftWriter(logger, validator),
};
const fixtures = [
  "WorkoutCustomTargetValues.zwo",
  "WorkoutIndividualSteps.zwo",
  "WorkoutRepeatGreaterThanStep.zwo",
  "WorkoutRepeatSteps.zwo",
].map((name) => ({ name, data: loadZwoFixture(name) }));

describe("Round-trip contract: ZWO", () => {
  it(
    "should keep every value of every ZWO workout within the declared tolerances",
    { timeout: 120_000 },
    async () => {
      // Arrange
      const contract = ZWO_ROUND_TRIP;

      // Act
      const report = await roundTripReport(contract, codec, fixtures);

      // Assert
      expect(report.differences).toEqual([]);
      expect(unusedDeclarations(contract, report)).toEqual([]);
    }
  );

  it(
    "should not carry any kind of step the ZWO contract declares unsupported",
    { timeout: 120_000 },
    async () => {
      // Arrange
      const contract = ZWO_ROUND_TRIP;

      // Act
      const carried = await unsupportedButCarried(contract, codec);

      // Assert
      expect(carried).toEqual([]);
    }
  );

  it("should refuse to write a recorded activity, which no ZWO Round-trip covers", async () => {
    // Arrange
    const activity = buildRecordedActivity();

    // Act
    const written = codec.write(activity);

    // Assert
    await expect(written).rejects.toThrow();
  });
});

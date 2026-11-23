/**
 * The FIT Round-trip, as the Kaiord SDK claims it: every workout case of the
 * FIT contract and every workout fixture goes through the real SDK Encoder
 * and Decoder, and every KRD value must come back within the declared
 * tolerances or be declared in `FIT_ROUND_TRIP`.
 */
import { FIT_ROUND_TRIP } from "@kaiord/core";
import {
  buildRecordedActivity,
  createMockLogger,
  FIXTURE_NAMES,
  loadFitFixture,
  roundTripReport,
  unsupportedButCarried,
  unusedDeclarations,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";

const logger = createMockLogger();
const codec = {
  read: createGarminFitSdkReader(logger),
  write: createGarminFitSdkWriter(logger),
};
const fixtures = Object.values(FIXTURE_NAMES).map((name) => ({
  name: `${name}.fit`,
  data: loadFitFixture(`${name}.fit`),
}));

describe("Round-trip contract: FIT", () => {
  it("should keep every value of every FIT workout within the declared tolerances", async () => {
    // Arrange
    const contract = FIT_ROUND_TRIP;

    // Act
    const report = await roundTripReport(contract, codec, fixtures);

    // Assert
    expect(report.differences).toEqual([]);
    expect(unusedDeclarations(contract, report)).toEqual([]);
  });

  it("should not carry any kind of step the FIT contract declares unsupported", async () => {
    // Arrange
    const contract = FIT_ROUND_TRIP;

    // Act
    const carried = await unsupportedButCarried(contract, codec);

    // Assert
    expect(carried).toEqual([]);
  });

  it("should refuse to write a recorded activity, which no FIT Round-trip covers", async () => {
    // Arrange
    const activity = buildRecordedActivity();

    // Act
    const written = codec.write(activity);

    // Assert
    await expect(written).rejects.toThrow();
  });
});

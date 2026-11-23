/**
 * The GCN Round-trip, as the Kaiord SDK claims it: every workout case of the
 * GCN contract and every GCN workout fixture goes through the adapter's own
 * reader and writer, and every KRD value must come back within the declared
 * tolerances or be declared in `GCN_ROUND_TRIP`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { GCN_ROUND_TRIP } from "@kaiord/core";
import {
  buildRecordedActivity,
  createMockLogger,
  roundTripReport,
  unsupportedButCarried,
  unusedDeclarations,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createGarminReader } from "../garmin-reader";
import { createGarminWriter } from "../garmin-writer";

const FTP_WATTS = 250;
const MAX_HEART_RATE = 190;
const fixturesDir = join(__dirname, "../../../../../test-fixtures/gcn");

const logger = createMockLogger();
const codec = {
  read: createGarminReader(logger),
  write: createGarminWriter({
    logger,
    ftpWatts: FTP_WATTS,
    maxHeartRate: MAX_HEART_RATE,
  }),
};
const fixtures = readdirSync(fixturesDir).map((name) => ({
  name,
  data: readFileSync(join(fixturesDir, name), "utf-8"),
}));

describe("Round-trip contract: GCN", () => {
  it(
    "should keep every value of every GCN workout within the declared tolerances",
    { timeout: 120_000 },
    async () => {
      // Arrange
      const contract = GCN_ROUND_TRIP;

      // Act
      const report = await roundTripReport(contract, codec, fixtures);

      // Assert
      expect(report.differences).toEqual([]);
      expect(unusedDeclarations(contract, report)).toEqual([]);
    }
  );

  it(
    "should not carry any kind of step the GCN contract declares unsupported",
    { timeout: 120_000 },
    async () => {
      // Arrange
      const contract = GCN_ROUND_TRIP;

      // Act
      const carried = await unsupportedButCarried(contract, codec);

      // Assert
      expect(carried).toEqual([]);
    }
  );

  it("should refuse to write a recorded activity, which no GCN Round-trip covers", async () => {
    // Arrange
    const activity = buildRecordedActivity();

    // Act
    const written = codec.write(activity);

    // Assert
    await expect(written).rejects.toThrow();
  });
});

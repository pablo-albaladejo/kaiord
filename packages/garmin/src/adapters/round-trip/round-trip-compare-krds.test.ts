import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { compareKRDs, createToleranceChecker } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { convertGarminToKRD } from "../converters/garmin-to-krd.converter";
import { convertKRDToGarmin } from "../converters/krd-to-garmin.converter";

const fixturesDir = join(__dirname, "../../../../../test-fixtures/gcn");
const fixtures = readdirSync(fixturesDir).filter((f) => f.endsWith(".gcn"));
const logger = createMockLogger();

describe("Garmin GCN Round-Trip compared step by step", () => {
  it.each(fixtures)(
    "should report no step violation for the round-trip of %s",
    (fixture) => {
      // Arrange
      const krd1 = convertGarminToKRD(
        readFileSync(join(fixturesDir, fixture), "utf-8"),
        logger
      );

      // Act
      const krd2 = convertGarminToKRD(
        convertKRDToGarmin(krd1, { logger }),
        logger
      );

      // Assert
      const checker = createToleranceChecker();
      expect(compareKRDs(krd1, krd2, checker, logger)).toStrictEqual([]);
    }
  );
});

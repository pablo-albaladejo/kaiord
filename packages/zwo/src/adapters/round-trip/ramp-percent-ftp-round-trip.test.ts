import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

const NATIVE_RAMPS = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Ramps</name>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.5" PowerHigh="0.75"/>
    <Ramp Duration="300" PowerLow="0.8" PowerHigh="1.05"/>
  </workout>
</workout_file>`;

type Step = { target: { value: unknown } };

const stepsOf = (krd: { extensions?: Record<string, unknown> }) =>
  (krd.extensions?.structured_workout as { steps: Array<Step> }).steps;

describe("Zwift ramp %FTP round-trip", () => {
  it(
    "should read native ramps as percent_ftp ranges",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(
        logger,
        createXsdZwiftValidator(logger)
      );

      // Act
      const krd = await reader(NATIVE_RAMPS);

      // Assert
      expect(stepsOf(krd).map((s) => s.target.value)).toStrictEqual([
        { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
        { unit: "range", min: 80, max: 105, basis: "percent_ftp" },
      ]);
    }
  );

  it(
    "should write the ramps back with their original FTP fractions",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const krd = await reader(NATIVE_RAMPS);

      // Act
      const xml = await writer(krd);
      const krd2 = await reader(xml);

      // Assert
      expect(xml).toContain('PowerLow="0.5"');
      expect(xml).toContain('PowerHigh="0.75"');
      expect(xml).not.toContain("kaiord:originalWattsLow");
      expect(stepsOf(krd2).map((s) => s.target.value)).toStrictEqual(
        stepsOf(krd).map((s) => s.target.value)
      );
    }
  );
});

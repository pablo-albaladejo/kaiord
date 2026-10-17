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
    <Ramp Duration="300" PowerLow="1.05" PowerHigh="0.8"/>
    <Cooldown Duration="600" PowerLow="0.75" PowerHigh="0.5"/>
  </workout>
</workout_file>`;

const POWER_ATTRIBUTES = [
  ["0.5", "0.75"],
  ["0.8", "1.05"],
  ["1.05", "0.8"],
  ["0.75", "0.5"],
];

type Step = { target: { value: unknown }; extensions?: unknown };

const stepsOf = (krd: { extensions?: Record<string, unknown> }) =>
  (krd.extensions?.structured_workout as { steps: Array<Step> }).steps;

const attribute = (tag: string, name: string): string =>
  new RegExp(` ${name}="([^"]+)"`).exec(tag)?.[1] ?? "";

const powerAttributesOf = (xml: string): Array<Array<string>> =>
  [...xml.matchAll(/<(?:Warmup|Ramp|Cooldown)\b[^>]*>/g)].map(([tag]) => [
    attribute(tag, "PowerLow"),
    attribute(tag, "PowerHigh"),
  ]);

const createIo = () => {
  const logger = createMockLogger();
  const validator = createXsdZwiftValidator(logger);
  return {
    reader: createFastXmlZwiftReader(logger, validator),
    writer: createFastXmlZwiftWriter(logger, validator),
  };
};

describe("Zwift ramp %FTP round-trip", () => {
  it(
    "should read every ramp as an ascending percent_ftp range",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const { reader } = createIo();

      // Act
      const krd = await reader(NATIVE_RAMPS);

      // Assert
      expect(stepsOf(krd).map((s) => s.target.value)).toStrictEqual([
        { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
        { unit: "range", min: 80, max: 105, basis: "percent_ftp" },
        { unit: "range", min: 80, max: 105, basis: "percent_ftp" },
        { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
      ]);
    }
  );

  it(
    "should flag only the descending blocks on the step's zwift extensions",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const { reader } = createIo();

      // Act
      const krd = await reader(NATIVE_RAMPS);

      // Assert
      const descending = { zwift: { powerDirection: "descending" } };
      expect(stepsOf(krd).map((s) => s.extensions)).toStrictEqual([
        undefined,
        undefined,
        descending,
        descending,
      ]);
    }
  );

  it(
    "should write every ramp back with its original PowerLow and PowerHigh",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const { reader, writer } = createIo();
      const krd = await reader(NATIVE_RAMPS);

      // Act
      const xml = await writer(krd);
      const krd2 = await reader(xml);

      // Assert
      expect(powerAttributesOf(xml)).toStrictEqual(POWER_ATTRIBUTES);
      expect(xml).not.toContain("kaiord:originalWattsLow");
      expect(krd2).toStrictEqual(krd);
    }
  );

  it(
    "should keep a 0.57 fraction exact through the percent rounding",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const { reader, writer } = createIo();
      const zwo = NATIVE_RAMPS.replace('PowerLow="0.5"', 'PowerLow="0.57"');
      const krd = await reader(zwo);

      // Act
      const xml = await writer(krd);

      // Assert
      expect(stepsOf(krd)[0]?.target.value).toMatchObject({ min: 57 });
      expect(xml).toContain('PowerLow="0.57"');
    }
  );
});

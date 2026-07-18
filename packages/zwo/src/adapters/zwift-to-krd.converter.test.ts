import { createMockLogger, loadZwoFixture } from "@kaiord/core/test-utils";
import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";

import { PARSER_NUMERICS } from "../test-utils";
import { convertZwiftToKRD } from "./zwift-to-krd.converter";

// Characterization tests for convertZwiftToKRD. Capture current parsing
// behavior on canonical ZWO fixtures. Production code is not modified.
const parseZwiftXml = (xmlString: string): unknown => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
  });
  return parser.parse(xmlString);
};

describe("convertZwiftToKRD (characterization)", () => {
  it("should produce a structured_workout KRD at version 1.0", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    // Act
    const krd = convertZwiftToKRD(zwoData, logger);

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
  });

  it("should map sportType=bike to cycling in metadata", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    // Act
    const krd = convertZwiftToKRD(zwoData, logger);

    // Assert
    expect(krd.metadata.sport).toBe("cycling");
  });

  it("should preserve workout name in extensions.structured_workout.name", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();
    const krd = convertZwiftToKRD(zwoData, logger);

    // Act
    const sw = krd.extensions?.structured_workout as { name?: string };

    // Assert
    expect(sw?.name).toBe("Example 1");
  });

  it("should emit one step per SteadyState block in the source XML", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();
    const krd = convertZwiftToKRD(zwoData, logger);

    // Act
    const sw = krd.extensions?.structured_workout as { steps?: unknown[] };

    // Assert
    expect(Array.isArray(sw?.steps)).toBe(true);
    expect(sw?.steps?.length).toBe(PARSER_NUMERICS.STEP_COUNT_4);
  });

  it("should populate the zwift extensions block with author/description/durationType", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();
    const krd = convertZwiftToKRD(zwoData, logger);

    // Act
    const zwift = krd.extensions?.zwift as Record<string, unknown> | undefined;

    // Assert
    expect(zwift).toBeDefined();
    expect(zwift?.author).toBeUndefined();
    expect(zwift?.description).toBeUndefined();
    expect(zwift?.durationType).toBe("time");
  });

  it("should capture kaiord round-trip metadata attributes when present", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    // Act
    const krd = convertZwiftToKRD(zwoData, logger);

    // Assert
    expect(krd.metadata.manufacturer).toBe("dynastream");
    expect(krd.metadata.serialNumber).toBe(String(PARSER_NUMERICS.ID_1234));
    expect(krd.metadata.created).toBe("2009-09-09T20:38:00.000Z");
  });

  it("should coerce a numeric ZWO serialNumber to a string in KRD", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    // Act
    const krd = convertZwiftToKRD(zwoData, logger);

    // Assert
    expect(typeof krd.metadata.serialNumber).toBe("string");
    expect(krd.metadata.serialNumber).toBe(String(PARSER_NUMERICS.ID_1234));
  });

  it("should emit a non-empty steps array for the repeat fixture", () => {
    // Arrange
    const zwoXml = loadZwoFixture("WorkoutRepeatSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();
    const krd = convertZwiftToKRD(zwoData, logger);

    // Act
    const sw = krd.extensions?.structured_workout as { steps?: unknown[] };

    // Assert
    expect(Array.isArray(sw?.steps)).toBe(true);
    expect(sw?.steps?.length ?? 0).toBeGreaterThan(0);
  });
});

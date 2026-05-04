import { createMockLogger, loadZwoFixture } from "@kaiord/core/test-utils";
import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";

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
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
  });

  it("should map sportType=bike to cycling in metadata", () => {
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    expect(krd.metadata.sport).toBe("cycling");
  });

  it("should preserve workout name in extensions.structured_workout.name", () => {
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    const sw = krd.extensions?.structured_workout as { name?: string };
    expect(sw?.name).toBe("Example 1");
  });

  it("should emit one step per SteadyState block in the source XML", () => {
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    const sw = krd.extensions?.structured_workout as { steps?: unknown[] };
    expect(Array.isArray(sw?.steps)).toBe(true);
    expect(sw?.steps?.length).toBe(4);
  });

  it("should populate the zwift extensions block with author/description/durationType", () => {
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    const zwift = krd.extensions?.zwift as Record<string, unknown> | undefined;
    expect(zwift).toBeDefined();
    // The fixture has no top-level <author> or <description> elements, so
    // the converter passes through `undefined` for both. Asserting the
    // actual value (rather than just key presence) catches regressions
    // where the converter starts injecting defaults or stops parsing.
    expect(zwift?.author).toBeUndefined();
    expect(zwift?.description).toBeUndefined();
    expect(zwift?.durationType).toBe("time");
  });

  it("should capture kaiord round-trip metadata attributes when present", () => {
    const zwoXml = loadZwoFixture("WorkoutIndividualSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    expect(krd.metadata.manufacturer).toBe("dynastream");
    // Current behavior: fast-xml-parser parses numeric attributes as numbers,
    // and the converter passes them through without coercion.
    expect(krd.metadata.serialNumber).toBe(1234);
    expect(krd.metadata.created).toBe("2009-09-09T20:38:00.000Z");
  });

  it("should emit a non-empty steps array for the repeat fixture", () => {
    const zwoXml = loadZwoFixture("WorkoutRepeatSteps.zwo");
    const zwoData = parseZwiftXml(zwoXml);
    const logger = createMockLogger();

    const krd = convertZwiftToKRD(zwoData, logger);

    const sw = krd.extensions?.structured_workout as { steps?: unknown[] };
    expect(Array.isArray(sw?.steps)).toBe(true);
    expect(sw?.steps?.length ?? 0).toBeGreaterThan(0);
  });
});

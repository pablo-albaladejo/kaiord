import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createWellFormednessValidator } from "./well-formedness-validator";

describe("createWellFormednessValidator", () => {
  const logger = createMockLogger();

  describe("valid XML", () => {
    it.each([
      {
        scenario: "well-formed Zwift XML",
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout</name>
  <description>Test Description</description>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`,
      },
      {
        scenario: "Zwift with multiple intervals",
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.5" PowerHigh="0.75"/>
    <SteadyState Duration="300" Power="0.85"/>
    <Cooldown Duration="600" PowerLow="0.75" PowerHigh="0.5"/>
  </workout>
</workout_file>`,
      },
      {
        scenario: "Zwift with IntervalsT",
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Intervals Workout</name>
  <sportType>bike</sportType>
  <workout>
    <IntervalsT Repeat="5" OnDuration="120" OffDuration="60" OnPower="1.0" OffPower="0.5"/>
  </workout>
</workout_file>`,
      },
      {
        scenario: "XML with missing optional fields",
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Minimal Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`,
      },
      {
        scenario: "XML with unknown elements (no XSD validation)",
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <unknownElement>This would fail XSD validation</unknownElement>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`,
      },
    ])("should accept $scenario as valid", async ({ xml }) => {
      // Arrange
      const validator = createWellFormednessValidator(logger);

      // Act
      const result = await validator(xml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("invalid XML", () => {
    it("should reject malformed XML", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout
  <sportType>bike</sportType>
</workout_file>`;

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("XML");
    });

    it.each([
      {
        scenario: "unclosed tags",
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
</workout_file>`,
      },
      { scenario: "empty string", xml: "" },
      { scenario: "non-XML content", xml: "This is not XML" },
    ])("should reject $scenario", async ({ xml }) => {
      // Arrange
      const validator = createWellFormednessValidator(logger);

      // Act
      const result = await validator(xml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

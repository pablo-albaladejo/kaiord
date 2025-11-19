import { describe, expect, it } from "vitest";
import { createMockLogger } from "../../tests/helpers/test-utils";
import { createWellFormednessValidator } from "./well-formedness-validator";

describe("createWellFormednessValidator", () => {
  const logger = createMockLogger();

  describe("valid XML", () => {
    it("should validate well-formed Zwift XML", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout</name>
  <description>Test Description</description>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`;

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate Zwift with multiple intervals", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.5" PowerHigh="0.75"/>
    <SteadyState Duration="300" Power="0.85"/>
    <Cooldown Duration="600" PowerLow="0.75" PowerHigh="0.5"/>
  </workout>
</workout_file>`;

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate Zwift with IntervalsT", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Intervals Workout</name>
  <sportType>bike</sportType>
  <workout>
    <IntervalsT Repeat="5" OnDuration="120" OffDuration="60" OnPower="1.0" OffPower="0.5"/>
  </workout>
</workout_file>`;

      // Act
      const result = await validator(validXml);

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

    it("should reject XML with unclosed tags", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
</workout_file>`;

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject empty string", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const invalidXml = "";

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject non-XML content", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const invalidXml = "This is not XML";

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("schema violations (not detected in well-formedness mode)", () => {
    it("should accept XML with missing optional fields", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Minimal Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`;

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept XML with unknown elements (no XSD validation)", async () => {
      // Arrange
      const validator = createWellFormednessValidator(logger);
      const xmlWithUnknownElement = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <unknownElement>This would fail XSD validation</unknownElement>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`;

      // Act
      const result = await validator(xmlWithUnknownElement);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

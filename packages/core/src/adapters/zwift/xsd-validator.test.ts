import { describe, expect, it } from "vitest";
import { createConsoleLogger } from "../logger/console-logger";
import { createXsdZwiftValidator, createZwiftValidator } from "./xsd-validator";

describe("createZwiftValidator", () => {
  const logger = createConsoleLogger();

  describe("environment detection", () => {
    it("should use well-formedness validator in browser environment", async () => {
      // Arrange
      // Simulate browser environment by setting window
      const originalWindow = global.window;
      // @ts-expect-error - Simulating browser environment
      global.window = {};

      const validator = createZwiftValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
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

      // Cleanup
      global.window = originalWindow;
    });

    it("should use XSD validator in Node.js environment", async () => {
      // Arrange
      // Ensure we're in Node.js environment (window should be undefined)
      const originalWindow = global.window;
      // @ts-expect-error - Ensuring Node.js environment
      global.window = undefined;

      const validator = createZwiftValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
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

      // Cleanup
      global.window = originalWindow;
    });
  });
});

describe("createXsdZwiftValidator", () => {
  const logger = createConsoleLogger();

  describe("valid XML", () => {
    it("should validate well-formed Zwift XML", async () => {
      // Arrange
      const validator = createXsdZwiftValidator(logger);
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
      const validator = createXsdZwiftValidator(logger);
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
      const validator = createXsdZwiftValidator(logger);
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
      const validator = createXsdZwiftValidator(logger);
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
      const validator = createXsdZwiftValidator(logger);
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
      const validator = createXsdZwiftValidator(logger);
      const invalidXml = "";

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject non-XML content", async () => {
      // Arrange
      const validator = createXsdZwiftValidator(logger);
      const invalidXml = "This is not XML";

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("schema violations", () => {
    it("should accept XML with missing optional fields", async () => {
      // Arrange
      const validator = createXsdZwiftValidator(logger);
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
  });
});

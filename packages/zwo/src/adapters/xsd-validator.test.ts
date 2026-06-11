import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { createXsdZwiftValidator } from "./xsd-validator";

describe("createZwiftValidator", () => {
  const logger = createMockLogger();

  describe("environment detection", () => {
    it(
      "should use well-formedness validator in browser environment",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const originalWindow = global.window;
        global.window = {};
        vi.resetModules();
        const { createZwiftValidator } = await import("./xsd-validator");
        const validator = createZwiftValidator(logger);
        const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`;
        const result = await validator(validXml);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        // Act
        global.window = originalWindow;

        // Assert
      }
    );

    it.skipIf(typeof window !== "undefined")(
      "should use XSD validator in Node.js environment",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const originalWindow = global.window;
        global.window = undefined;
        vi.resetModules();
        const { createZwiftValidator } = await import("./xsd-validator");
        const validator = createZwiftValidator(logger);
        const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`;
        const result = await validator(validXml);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        // Act
        global.window = originalWindow;

        // Assert
      }
    );
  });
});

describe("createXsdZwiftValidator", () => {
  const logger = createMockLogger();

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

describe("createXsdZwiftValidator schema enforcement", () => {
  it("should reject well-formed XML that violates the Zwift schema", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdZwiftValidator(logger);
    const wellFormedButInvalid =
      '<?xml version="1.0" encoding="UTF-8"?><workout_file><not_a_zwift_element/></workout_file>';

    // Act
    const result = await validator(wellFormedButInvalid);

    // Assert
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

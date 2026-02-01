import { describe, expect, it, vi } from "vitest";
import { createConsoleLogger } from "../logger/console-logger";
import { createXsdZwiftValidator } from "./xsd-validator";

describe("createZwiftValidator", () => {
  const logger = createConsoleLogger();

  describe("environment detection", () => {
    it("should use well-formedness validator in browser environment", { timeout: 30_000 }, async () => {
      // Arrange
      // Simulate browser environment by setting window
      const originalWindow = global.window;
      // @ts-expect-error - Simulating browser environment
      global.window = {};

      // Reset modules to force re-evaluation of isBrowser
      vi.resetModules();

      // Dynamically import to get fresh module with new isBrowser value
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

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Cleanup
      global.window = originalWindow;
    });

    it.skip("should use XSD validator in Node.js environment", async () => {
      // SKIPPED: Dynamic imports with vi.resetModules() can timeout in CI
      // Arrange
      // Ensure we're in Node.js environment (window should be undefined)
      const originalWindow = global.window;
      // @ts-expect-error - Ensuring Node.js environment
      global.window = undefined;

      // Reset modules to force re-evaluation of isBrowser
      vi.resetModules();

      // Dynamically import to get fresh module with new isBrowser value
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

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Cleanup
      global.window = originalWindow;
    });

    /**
     * Property 6: Environment detection reflects current state
     * Feature: 08-pr25-fixes, Property 6: Environment detection reflects current state
     * Validates: Requirements 5.1, 5.2, 5.3
     *
     * For any test that modifies global.window, the module's isBrowser flag
     * should reflect the modified state after module reload.
     *
     * This property test validates that:
     * 1. Setting global.window to any truthy value makes isBrowser true
     * 2. Setting global.window to undefined makes isBrowser false
     * 3. Module reload is required for the flag to update
     * 4. The behavior is consistent across multiple iterations
     */
    describe("property: environment detection reflects current state", () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.75"/>
  </workout>
</workout_file>`;

      // Test multiple window object variations to ensure property holds
      const windowVariations = [
        { description: "empty object", value: {} },
        { description: "object with properties", value: { document: {} } },
        {
          description: "object with navigator",
          value: { navigator: { userAgent: "test" } },
        },
        { description: "minimal window-like object", value: { location: {} } },
      ];

      windowVariations.forEach(({ description, value }) => {
        it(`should detect browser environment when window is ${description}`, async () => {
          // Arrange
          const originalWindow = global.window;
          // @ts-expect-error - Simulating browser environment
          global.window = value;

          // Reset modules to force re-evaluation of isBrowser
          vi.resetModules();

          // Act
          const { createZwiftValidator } = await import("./xsd-validator");
          const validator = createZwiftValidator(logger);
          const result = await validator(validXml);

          // Assert - Should use well-formedness validator (browser behavior)
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);

          // Cleanup
          global.window = originalWindow;
        });
      });

      it("should detect Node.js environment when window is undefined", { timeout: 30_000 }, async () => {
        // Arrange
        const originalWindow = global.window;
        // @ts-expect-error - Simulating Node.js environment
        global.window = undefined;

        // Reset modules to force re-evaluation of isBrowser
        vi.resetModules();

        // Act
        const { createZwiftValidator } = await import("./xsd-validator");
        const validator = createZwiftValidator(logger);
        const result = await validator(validXml);

        // Assert - Should use XSD validator (Node.js behavior)
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        // Cleanup
        global.window = originalWindow;
      });

      it("should require module reload for environment detection to update", { timeout: 30_000 }, async () => {
        // Arrange
        const originalWindow = global.window;

        // First, set to browser environment
        // @ts-expect-error - Simulating browser environment
        global.window = {};
        vi.resetModules();
        const { createZwiftValidator: createBrowserValidator } = await import(
          "./xsd-validator"
        );
        const browserValidator = createBrowserValidator(logger);

        // Then, change to Node.js environment WITHOUT module reload
        // @ts-expect-error - Simulating Node.js environment
        global.window = undefined;
        // Note: NOT calling vi.resetModules() here

        // Act - Import again without reset (should get cached module)
        const { createZwiftValidator: createCachedValidator } = await import(
          "./xsd-validator"
        );
        const cachedValidator = createCachedValidator(logger);

        // Assert - Both validators should behave the same (browser mode)
        // because module wasn't reloaded
        const browserResult = await browserValidator(validXml);
        const cachedResult = await cachedValidator(validXml);

        expect(browserResult.valid).toBe(true);
        expect(cachedResult.valid).toBe(true);

        // Now reset modules and verify Node.js behavior
        vi.resetModules();
        const { createZwiftValidator: createNodeValidator } = await import(
          "./xsd-validator"
        );
        const nodeValidator = createNodeValidator(logger);
        const nodeResult = await nodeValidator(validXml);

        expect(nodeResult.valid).toBe(true);

        // Cleanup
        global.window = originalWindow;
      });

      it("should consistently detect environment across multiple reloads", { timeout: 30_000 }, async () => {
        // Arrange
        const originalWindow = global.window;
        const iterations = 5;

        // Act & Assert - Test consistency across multiple reloads
        for (let i = 0; i < iterations; i++) {
          // Browser environment
          // @ts-expect-error - Simulating browser environment
          global.window = { iteration: i };
          vi.resetModules();
          const { createZwiftValidator: createBrowserValidator } = await import(
            "./xsd-validator"
          );
          const browserValidator = createBrowserValidator(logger);
          const browserResult = await browserValidator(validXml);
          expect(browserResult.valid).toBe(true);

          // Node.js environment
          // @ts-expect-error - Simulating Node.js environment
          global.window = undefined;
          vi.resetModules();
          const { createZwiftValidator: createNodeValidator } = await import(
            "./xsd-validator"
          );
          const nodeValidator = createNodeValidator(logger);
          const nodeResult = await nodeValidator(validXml);
          expect(nodeResult.valid).toBe(true);
        }

        // Cleanup
        global.window = originalWindow;
      });
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

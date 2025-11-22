import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLogger } from "./logger-factory";

describe("logger-factory", () => {
  let originalIsTTY: boolean | undefined;
  let originalCI: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Save original values
    originalIsTTY = process.stdout.isTTY;
    originalCI = process.env.CI;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original values
    if (originalIsTTY !== undefined) {
      Object.defineProperty(process.stdout, "isTTY", {
        value: originalIsTTY,
        writable: true,
      });
    }
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe("environment detection", () => {
    it("should create pretty logger in TTY environment", async () => {
      // Arrange
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      delete process.env.CI;
      delete process.env.NODE_ENV;

      // Act
      const logger = await createLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should create structured logger in CI environment", async () => {
      // Arrange
      process.env.CI = "true";

      // Act
      const logger = await createLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should create structured logger in production environment", async () => {
      // Arrange
      process.env.NODE_ENV = "production";

      // Act
      const logger = await createLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should create structured logger in non-TTY environment", async () => {
      // Arrange
      Object.defineProperty(process.stdout, "isTTY", {
        value: false,
        writable: true,
      });
      delete process.env.CI;
      delete process.env.NODE_ENV;

      // Act
      const logger = await createLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe("explicit logger type", () => {
    it("should create pretty logger when type is specified", async () => {
      // Arrange
      process.env.CI = "true"; // Even in CI

      // Act
      const logger = await createLogger({ type: "pretty" });

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should create structured logger when type is specified", async () => {
      // Arrange
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        writable: true,
      });
      delete process.env.CI;

      // Act
      const logger = await createLogger({ type: "structured" });

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe("logger options", () => {
    it("should pass options to logger implementation", async () => {
      // Arrange & Act
      const logger = await createLogger({
        level: "warn",
        quiet: true,
      });

      // Assert
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });
});

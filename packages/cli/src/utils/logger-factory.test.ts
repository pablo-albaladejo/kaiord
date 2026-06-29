import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPrettyLogger } from "../adapters/logger/pretty-logger";
import { createStructuredLogger } from "../adapters/logger/structured-logger";
import { createLogger } from "./logger-factory";

vi.mock("../adapters/logger/pretty-logger", () => ({
  createPrettyLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock("../adapters/logger/structured-logger", () => ({
  createStructuredLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("logger-factory", () => {
  let originalIsTTY: boolean | undefined;
  let originalCI: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Save original values
    originalIsTTY = process.stdout.isTTY;
    originalCI = process.env.CI;
    originalNodeEnv = process.env.NODE_ENV;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      writable: true,
    });
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
      expect(createPrettyLogger).toHaveBeenCalledTimes(1);
      expect(createStructuredLogger).not.toHaveBeenCalled();
    });

    it("should create structured logger in CI environment", async () => {
      // Arrange
      process.env.CI = "true";

      // Act
      const logger = await createLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(createStructuredLogger).toHaveBeenCalledTimes(1);
      expect(createPrettyLogger).not.toHaveBeenCalled();
    });

    it("should create structured logger in production environment", async () => {
      // Arrange
      process.env.NODE_ENV = "production";

      // Act
      const logger = await createLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(createStructuredLogger).toHaveBeenCalledTimes(1);
      expect(createPrettyLogger).not.toHaveBeenCalled();
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
      expect(createStructuredLogger).toHaveBeenCalledTimes(1);
      expect(createPrettyLogger).not.toHaveBeenCalled();
    });
  });

  describe("explicit logger type", () => {
    it("should create pretty logger when type is specified", async () => {
      // Arrange
      process.env.CI = "true";

      // Act
      const logger = await createLogger({ type: "pretty" });

      // Assert
      expect(logger).toBeDefined();
      expect(createPrettyLogger).toHaveBeenCalledTimes(1);
      expect(createStructuredLogger).not.toHaveBeenCalled();
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
      expect(createStructuredLogger).toHaveBeenCalledTimes(1);
      expect(createPrettyLogger).not.toHaveBeenCalled();
    });
  });

  describe("logger options", () => {
    it("should pass options to logger implementation", async () => {
      // Arrange
      const options = { level: "warn", quiet: true } as const;

      // Act
      const logger = await createLogger(options);

      // Assert
      expect(logger).toBeDefined();
      const allCalls = [
        ...vi.mocked(createPrettyLogger).mock.calls,
        ...vi.mocked(createStructuredLogger).mock.calls,
      ];
      expect(allCalls).toHaveLength(1);
      expect(allCalls[0]?.[0]).toEqual(options);
    });
  });
});

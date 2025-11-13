import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsoleLogger } from "./console-logger";

describe("createConsoleLogger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create logger with all required methods", () => {
    // Arrange & Act
    const logger = createConsoleLogger();

    // Assert
    expect(logger).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it("should call console.debug with message and context", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Debug message";
    const context = { key: "value" };

    // Act
    logger.debug(message, context);

    // Assert
    expect(console.debug).toHaveBeenCalledWith(message, context);
  });

  it("should call console.debug with message only", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Debug message";

    // Act
    logger.debug(message);

    // Assert
    expect(console.debug).toHaveBeenCalledWith(message, undefined);
  });

  it("should call console.info with message and context", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Info message";
    const context = { key: "value" };

    // Act
    logger.info(message, context);

    // Assert
    expect(console.info).toHaveBeenCalledWith(message, context);
  });

  it("should call console.info with message only", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Info message";

    // Act
    logger.info(message);

    // Assert
    expect(console.info).toHaveBeenCalledWith(message, undefined);
  });

  it("should call console.warn with message and context", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Warning message";
    const context = { key: "value" };

    // Act
    logger.warn(message, context);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(message, context);
  });

  it("should call console.warn with message only", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Warning message";

    // Act
    logger.warn(message);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(message, undefined);
  });

  it("should call console.error with message and context", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Error message";
    const context = { key: "value" };

    // Act
    logger.error(message, context);

    // Assert
    expect(console.error).toHaveBeenCalledWith(message, context);
  });

  it("should call console.error with message only", () => {
    // Arrange
    const logger = createConsoleLogger();
    const message = "Error message";

    // Act
    logger.error(message);

    // Assert
    expect(console.error).toHaveBeenCalledWith(message, undefined);
  });
});

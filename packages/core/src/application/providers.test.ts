import { describe, expect, it, vi } from "vitest";
import type { Logger } from "../ports/logger";
import { createDefaultProviders } from "./providers";

describe("createDefaultProviders", () => {
  it("should create all components with default console logger", () => {
    // Act
    const providers = createDefaultProviders();

    // Assert
    expect(providers.fitReader).toBeDefined();
    expect(providers.fitWriter).toBeDefined();
    expect(providers.schemaValidator).toBeDefined();
    expect(providers.toleranceChecker).toBeDefined();
    expect(providers.convertFitToKrd).toBeDefined();
    expect(providers.convertKrdToFit).toBeDefined();
    expect(providers.logger).toBeDefined();
  });

  it("should use injected logger when provided", () => {
    // Arrange
    const mockLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Act
    const providers = createDefaultProviders(mockLogger);

    // Assert
    expect(providers.logger).toBe(mockLogger);
  });

  it("should wire fitReader to convertFitToKrd use case", () => {
    // Arrange
    const providers = createDefaultProviders();

    // Assert
    expect(providers.convertFitToKrd).toBeDefined();
    expect(typeof providers.convertFitToKrd).toBe("function");
  });

  it("should wire fitWriter to convertKrdToFit use case", () => {
    // Arrange
    const providers = createDefaultProviders();

    // Assert
    expect(providers.convertKrdToFit).toBeDefined();
    expect(typeof providers.convertKrdToFit).toBe("function");
  });

  it("should create schemaValidator with logger", () => {
    // Arrange
    const mockLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Act
    const providers = createDefaultProviders(mockLogger);

    // Assert
    expect(providers.schemaValidator).toBeDefined();
    expect(providers.schemaValidator.validate).toBeDefined();
  });

  it("should create toleranceChecker with default tolerances", () => {
    // Arrange
    const providers = createDefaultProviders();

    // Assert
    expect(providers.toleranceChecker).toBeDefined();
    expect(providers.toleranceChecker.checkTime).toBeDefined();
    expect(providers.toleranceChecker.checkDistance).toBeDefined();
    expect(providers.toleranceChecker.checkPower).toBeDefined();
    expect(providers.toleranceChecker.checkHeartRate).toBeDefined();
    expect(providers.toleranceChecker.checkCadence).toBeDefined();
    expect(providers.toleranceChecker.checkPace).toBeDefined();
  });
});

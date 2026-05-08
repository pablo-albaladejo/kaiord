import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { POWER_WATTS_250 } from "../../test-utils/constants";
import {
  extractExtensions,
  extractIntensity,
  extractPowerFromExtensions,
} from "./step-helpers";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("extractIntensity", () => {
  it("should extract Warmup as warmup", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "Warmup" });

    // Assert
    expect(result).toBe("warmup");
  });

  it("should extract Active as active", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "Active" });

    // Assert
    expect(result).toBe("active");
  });

  it("should extract Cooldown as cooldown", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "Cooldown" });

    // Assert
    expect(result).toBe("cooldown");
  });

  it("should extract Rest as rest", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "Rest" });

    // Assert
    expect(result).toBe("rest");
  });

  it("should extract Resting as rest", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "Resting" });

    // Assert
    expect(result).toBe("rest");
  });

  it("should handle lowercase warmup", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "warmup" });

    // Assert
    expect(result).toBe("warmup");
  });

  it("should return undefined for missing Intensity", () => {
    // Arrange

    // Act
    const result = extractIntensity({});

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined for unknown intensity", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: "Unknown" });

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined intensity value", () => {
    // Arrange

    // Act
    const result = extractIntensity({ Intensity: undefined });

    // Assert
    expect(result).toBeUndefined();
  });
});

describe("extractPowerFromExtensions", () => {
  it("should extract Watts from TPX extension", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = {
      TPX: { Watts: 250 },
    };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBe(POWER_WATTS_250);
    expect(logger.debug).toHaveBeenCalledWith(
      "Found power data in TCX extensions",
      { watts: 250 }
    );
  });

  it("should extract Power from extensions", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = { Power: 200 };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBe(200);
  });

  it("should return undefined when no power data", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = { HeartRate: 150 };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when TPX has no Watts", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = {
      TPX: { HeartRate: 150 },
    };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when Power is not a number", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = { Power: "200" };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when Watts is not a number", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = {
      TPX: { Watts: "250" },
    };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should prefer TPX.Watts over Power", () => {
    // Arrange
    const logger = createMockLogger();
    const extensions = {
      TPX: { Watts: 250 },
      Power: 200,
    };

    // Act
    const result = extractPowerFromExtensions(extensions, logger);

    // Assert
    expect(result).toBe(POWER_WATTS_250);
  });
});

describe("extractExtensions", () => {
  it("should extract extensions from step", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxStep = {
      Extensions: { TPX: { Watts: 250 } },
    };

    // Act
    const result = extractExtensions(tcxStep, logger);

    // Assert
    expect(result).toStrictEqual({ TPX: { Watts: 250 } });
    expect(logger.debug).toHaveBeenCalledWith(
      "Extracting TCX extensions from step"
    );
  });

  it("should return undefined when no extensions", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxStep = { Name: "Step 1" };

    // Act
    const result = extractExtensions(tcxStep, logger);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return a shallow copy of extensions", () => {
    // Arrange
    const logger = createMockLogger();
    const originalExtensions = { TPX: { Watts: 250 } };
    const tcxStep = { Extensions: originalExtensions };

    // Act
    const result = extractExtensions(tcxStep, logger);

    // Assert
    expect(result).not.toBe(originalExtensions);
    expect(result).toStrictEqual(originalExtensions);
  });
});

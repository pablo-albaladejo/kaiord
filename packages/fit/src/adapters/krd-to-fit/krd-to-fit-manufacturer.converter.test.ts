import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { mapManufacturer } from "./krd-to-fit-manufacturer.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("mapManufacturer", () => {
  it("should return fallback when manufacturer is undefined", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = mapManufacturer(undefined, logger);

    // Assert
    expect(result).toBe("garmin");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should match exact manufacturer names case-insensitively", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = mapManufacturer("Garmin", logger);

    // Assert
    expect(result).toBe("garmin");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should match by enum-prefix when input is shorter than enum value", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    // "wahooFitness" is the FIT enum value; user inputs just "wahoo"
    const result = mapManufacturer("wahoo", logger);

    // Assert
    expect(result).toBe("wahooFitness");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should match by reverse-prefix when input is longer than enum value", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    // "garmin connect" starts with the "garmin" enum value
    const result = mapManufacturer("garmin connect", logger);

    // Assert
    expect(result).toBe("garmin");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should fall back and warn for an unknown manufacturer", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = mapManufacturer("totally_made_up_brand", logger);

    // Assert
    expect(result).toBe("garmin");
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Unknown manufacturer"),
      expect.objectContaining({
        original: "totally_made_up_brand",
        fallback: "garmin",
      })
    );
  });
});

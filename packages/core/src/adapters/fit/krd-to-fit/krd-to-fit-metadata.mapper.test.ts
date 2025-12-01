import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { convertMetadataToFileId } from "./krd-to-fit-metadata.mapper";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertMetadataToFileId - NaN validation", () => {
  /**
   * Property 4: NaN validation prevents invalid assignments
   * Validates: Requirements 3.1, 3.2
   *
   * For any string value that parses to NaN, the parsed value should not be
   * assigned to numeric fields.
   */
  it("should not assign serialNumber when parsing results in NaN", () => {
    // Arrange
    const logger = createMockLogger();
    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: faker.date.recent().toISOString(),
        sport: "cycling",
        serialNumber: "not-a-number", // Will parse to NaN
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    // Act
    const result = convertMetadataToFileId(krd, logger);

    // Assert
    expect(result.serialNumber).toBeUndefined();
  });

  it("should assign serialNumber when parsing results in valid number", () => {
    // Arrange
    const logger = createMockLogger();
    const validSerialNumber = faker.number.int({ min: 1, max: 999999 });
    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: faker.date.recent().toISOString(),
        sport: "cycling",
        serialNumber: validSerialNumber.toString(),
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    // Act
    const result = convertMetadataToFileId(krd, logger);

    // Assert
    expect(result.serialNumber).toBe(validSerialNumber);
  });

  it("should not assign product when parsing results in NaN", () => {
    // Arrange
    const logger = createMockLogger();
    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: faker.date.recent().toISOString(),
        sport: "cycling",
        product: "invalid-product", // Will parse to NaN
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    // Act
    const result = convertMetadataToFileId(krd, logger);

    // Assert
    expect(result.product).toBeUndefined();
  });

  it("should assign product when parsing results in valid number", () => {
    // Arrange
    const logger = createMockLogger();
    const validProduct = faker.number.int({ min: 1, max: 9999 });
    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: faker.date.recent().toISOString(),
        sport: "cycling",
        product: validProduct.toString(),
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    // Act
    const result = convertMetadataToFileId(krd, logger);

    // Assert
    expect(result.product).toBe(validProduct);
  });

  it("should handle empty string serialNumber", () => {
    // Arrange
    const logger = createMockLogger();
    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: faker.date.recent().toISOString(),
        sport: "cycling",
        serialNumber: "", // Empty string
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    // Act
    const result = convertMetadataToFileId(krd, logger);

    // Assert
    expect(result.serialNumber).toBeUndefined();
  });

  it("should handle undefined serialNumber", () => {
    // Arrange
    const logger = createMockLogger();
    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: faker.date.recent().toISOString(),
        sport: "cycling",
        // serialNumber is undefined
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    // Act
    const result = convertMetadataToFileId(krd, logger);

    // Assert
    expect(result.serialNumber).toBeUndefined();
  });
});

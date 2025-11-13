import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitReader } from "../../ports/fit-reader";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { convertFitToKrd } from "./convert-fit-to-krd.js";

describe("convertFitToKrd", () => {
  it("should convert FIT buffer to KRD when validation passes", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const expectedKrd = buildKRD.build();

    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(expectedKrd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertFitToKrd(
      mockFitReader,
      mockValidator,
      logger
    )({ fitBuffer });

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(mockFitReader).toHaveBeenCalledWith(fitBuffer);
    expect(mockValidator.validate).toHaveBeenCalledWith(expectedKrd);
  });

  it("should throw KrdValidationError when validation fails", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertFitToKrd(mockFitReader, mockValidator, logger)({ fitBuffer })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertFitToKrd(mockFitReader, mockValidator, logger)({ fitBuffer })
    ).rejects.toThrow("KRD validation failed");
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    try {
      await convertFitToKrd(
        mockFitReader,
        mockValidator,
        logger
      )({
        fitBuffer,
      });
      expect.fail("Should have thrown KrdValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(KrdValidationError);
      if (error instanceof KrdValidationError) {
        expect(error.errors).toStrictEqual(validationErrors);
      }
    }
  });

  it("should propagate FitReader errors", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const readerError = new Error("Failed to read FIT file");

    const mockFitReader = vi.fn<FitReader>().mockRejectedValue(readerError);
    const mockValidator: SchemaValidator = {
      validate: vi.fn(),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertFitToKrd(mockFitReader, mockValidator, logger)({ fitBuffer })
    ).rejects.toThrow(readerError);
    expect(mockValidator.validate).not.toHaveBeenCalled();
  });

  it("should validate KRD after reading from FIT", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const krd = buildKRD.build();

    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    await convertFitToKrd(mockFitReader, mockValidator, logger)({ fitBuffer });

    // Assert
    expect(mockFitReader).toHaveBeenCalledWith(fitBuffer);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
  });
});

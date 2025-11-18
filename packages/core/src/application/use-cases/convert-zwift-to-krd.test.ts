import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { ZwiftReader } from "../../ports/zwift-reader";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { convertZwiftToKrd } from "./convert-zwift-to-krd.js";

describe("convertZwiftToKrd", () => {
  it("should convert Zwift string to KRD when validation passes", async () => {
    // Arrange
    const zwiftString = "<workout_file>...</workout_file>";
    const expectedKrd = buildKRD.build();

    const mockZwiftReader = vi.fn<ZwiftReader>().mockResolvedValue(expectedKrd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertZwiftToKrd(
      mockZwiftReader,
      mockValidator,
      logger
    )({ zwiftString });

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(mockZwiftReader).toHaveBeenCalledWith(zwiftString);
    expect(mockValidator.validate).toHaveBeenCalledWith(expectedKrd);
  });

  it("should throw KrdValidationError when validation fails", async () => {
    // Arrange
    const zwiftString = "<workout_file>...</workout_file>";
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockZwiftReader = vi.fn<ZwiftReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertZwiftToKrd(mockZwiftReader, mockValidator, logger)({ zwiftString })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertZwiftToKrd(mockZwiftReader, mockValidator, logger)({ zwiftString })
    ).rejects.toThrow("KRD validation failed");
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const zwiftString = "<workout_file>...</workout_file>";
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockZwiftReader = vi.fn<ZwiftReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    try {
      await convertZwiftToKrd(
        mockZwiftReader,
        mockValidator,
        logger
      )({
        zwiftString,
      });
      expect.fail("Should have thrown KrdValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(KrdValidationError);
      if (error instanceof KrdValidationError) {
        expect(error.errors).toStrictEqual(validationErrors);
      }
    }
  });

  it("should propagate ZwiftReader errors", async () => {
    // Arrange
    const zwiftString = "<workout_file>...</workout_file>";
    const readerError = new Error("Failed to read Zwift file");

    const mockZwiftReader = vi.fn<ZwiftReader>().mockRejectedValue(readerError);
    const mockValidator: SchemaValidator = {
      validate: vi.fn(),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertZwiftToKrd(mockZwiftReader, mockValidator, logger)({ zwiftString })
    ).rejects.toThrow(readerError);
    expect(mockValidator.validate).not.toHaveBeenCalled();
  });

  it("should validate KRD after reading from Zwift", async () => {
    // Arrange
    const zwiftString = "<workout_file>...</workout_file>";
    const krd = buildKRD.build();

    const mockZwiftReader = vi.fn<ZwiftReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    await convertZwiftToKrd(
      mockZwiftReader,
      mockValidator,
      logger
    )({
      zwiftString,
    });

    // Assert
    expect(mockZwiftReader).toHaveBeenCalledWith(zwiftString);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
  });
});

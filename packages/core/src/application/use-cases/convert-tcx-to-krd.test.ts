import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { TcxReader } from "../../ports/tcx-reader";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { convertTcxToKrd } from "./convert-tcx-to-krd.js";

describe("convertTcxToKrd", () => {
  it("should convert TCX string to KRD when validation passes", async () => {
    // Arrange
    const tcxString = "<TrainingCenterDatabase>...</TrainingCenterDatabase>";
    const expectedKrd = buildKRD.build();

    const mockTcxReader = vi.fn<TcxReader>().mockResolvedValue(expectedKrd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertTcxToKrd(
      mockTcxReader,
      mockValidator,
      logger
    )({ tcxString });

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(mockTcxReader).toHaveBeenCalledWith(tcxString);
    expect(mockValidator.validate).toHaveBeenCalledWith(expectedKrd);
  });

  it("should throw KrdValidationError when validation fails", async () => {
    // Arrange
    const tcxString = "<TrainingCenterDatabase>...</TrainingCenterDatabase>";
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockTcxReader = vi.fn<TcxReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertTcxToKrd(mockTcxReader, mockValidator, logger)({ tcxString })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertTcxToKrd(mockTcxReader, mockValidator, logger)({ tcxString })
    ).rejects.toThrow("KRD validation failed");
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const tcxString = "<TrainingCenterDatabase>...</TrainingCenterDatabase>";
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockTcxReader = vi.fn<TcxReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    try {
      await convertTcxToKrd(
        mockTcxReader,
        mockValidator,
        logger
      )({
        tcxString,
      });
      expect.fail("Should have thrown KrdValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(KrdValidationError);
      if (error instanceof KrdValidationError) {
        expect(error.errors).toStrictEqual(validationErrors);
      }
    }
  });

  it("should propagate TcxReader errors", async () => {
    // Arrange
    const tcxString = "<TrainingCenterDatabase>...</TrainingCenterDatabase>";
    const readerError = new Error("Failed to read TCX file");

    const mockTcxReader = vi.fn<TcxReader>().mockRejectedValue(readerError);
    const mockValidator: SchemaValidator = {
      validate: vi.fn(),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertTcxToKrd(mockTcxReader, mockValidator, logger)({ tcxString })
    ).rejects.toThrow(readerError);
    expect(mockValidator.validate).not.toHaveBeenCalled();
  });

  it("should validate KRD after reading from TCX", async () => {
    // Arrange
    const tcxString = "<TrainingCenterDatabase>...</TrainingCenterDatabase>";
    const krd = buildKRD.build();

    const mockTcxReader = vi.fn<TcxReader>().mockResolvedValue(krd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    await convertTcxToKrd(mockTcxReader, mockValidator, logger)({ tcxString });

    // Assert
    expect(mockTcxReader).toHaveBeenCalledWith(tcxString);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
  });
});

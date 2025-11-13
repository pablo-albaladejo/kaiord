import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitReader } from "../../ports/fit-reader";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { createConvertFitToKrd } from "./convert-fit-to-krd.js";

describe("createConvertFitToKrd", () => {
  it("should create a use case with execute method", () => {
    // Arrange
    const mockFitReader: FitReader = {
      readToKRD: vi.fn(),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn(),
    };
    const logger = createMockLogger();

    // Act
    const useCase = createConvertFitToKrd(mockFitReader, mockValidator, logger);

    // Assert
    expect(useCase).toBeDefined();
    expect(useCase.execute).toBeDefined();
    expect(typeof useCase.execute).toBe("function");
  });
});

describe("ConvertFitToKrd.execute", () => {
  it("should convert FIT buffer to KRD when validation passes", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const expectedKrd = buildKRD.build();

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockResolvedValue(expectedKrd),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    const useCase = createConvertFitToKrd(mockFitReader, mockValidator, logger);

    // Act
    const result = await useCase.execute(fitBuffer);

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(mockFitReader.readToKRD).toHaveBeenCalledWith(fitBuffer);
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

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockResolvedValue(krd),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    const useCase = createConvertFitToKrd(mockFitReader, mockValidator, logger);

    // Act & Assert
    await expect(useCase.execute(fitBuffer)).rejects.toThrow(
      KrdValidationError
    );
    await expect(useCase.execute(fitBuffer)).rejects.toThrow(
      "KRD validation failed"
    );
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockResolvedValue(krd),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    const useCase = createConvertFitToKrd(mockFitReader, mockValidator, logger);

    // Act & Assert
    try {
      await useCase.execute(fitBuffer);
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

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockRejectedValue(readerError),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn(),
    };
    const logger = createMockLogger();

    const useCase = createConvertFitToKrd(mockFitReader, mockValidator, logger);

    // Act & Assert
    await expect(useCase.execute(fitBuffer)).rejects.toThrow(readerError);
    expect(mockValidator.validate).not.toHaveBeenCalled();
  });

  it("should validate KRD after reading from FIT", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const krd = buildKRD.build();

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockResolvedValue(krd),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    const useCase = createConvertFitToKrd(mockFitReader, mockValidator, logger);

    // Act
    await useCase.execute(fitBuffer);

    // Assert
    expect(mockFitReader.readToKRD).toHaveBeenCalledWith(fitBuffer);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
  });
});

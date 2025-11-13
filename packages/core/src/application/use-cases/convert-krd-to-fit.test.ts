import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitWriter } from "../../ports/fit-writer";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { convertKrdToFit } from "./convert-krd-to-fit.js";

describe("convertKrdToFit", () => {
  it("should convert KRD to FIT buffer when validation passes", async () => {
    // Arrange
    const krd = buildKRD.build();
    const expectedBuffer = new Uint8Array([1, 2, 3, 4]);

    const mockFitWriter: FitWriter = {
      writeFromKRD: vi.fn().mockResolvedValue(expectedBuffer),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertKrdToFit(
      mockFitWriter,
      mockValidator,
      logger
    )({ krd });

    // Assert
    expect(result).toStrictEqual(expectedBuffer);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
    expect(mockFitWriter.writeFromKRD).toHaveBeenCalledWith(krd);
  });

  it("should throw KrdValidationError when pre-validation fails", async () => {
    // Arrange
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockFitWriter: FitWriter = {
      writeFromKRD: vi.fn(),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToFit(mockFitWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertKrdToFit(mockFitWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow("KRD validation failed");
    expect(mockFitWriter.writeFromKRD).not.toHaveBeenCalled();
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockFitWriter: FitWriter = {
      writeFromKRD: vi.fn(),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToFit(mockFitWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertKrdToFit(mockFitWriter, mockValidator, logger)({ krd })
    ).rejects.toMatchObject({
      errors: validationErrors,
    });
  });

  it("should propagate FitWriter errors", async () => {
    // Arrange
    const krd = buildKRD.build();
    const writerError = new Error("Failed to write FIT file");

    const mockFitWriter: FitWriter = {
      writeFromKRD: vi.fn().mockRejectedValue(writerError),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToFit(mockFitWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(writerError);
  });

  it("should validate KRD before writing to FIT", async () => {
    // Arrange
    const krd = buildKRD.build();
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);

    const mockFitWriter: FitWriter = {
      writeFromKRD: vi.fn().mockResolvedValue(fitBuffer),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    await convertKrdToFit(mockFitWriter, mockValidator, logger)({ krd });

    // Assert
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
    expect(mockFitWriter.writeFromKRD).toHaveBeenCalledWith(krd);
  });
});

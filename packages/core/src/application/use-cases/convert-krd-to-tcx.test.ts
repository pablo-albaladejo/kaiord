import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { TcxWriter } from "../../ports/tcx-writer";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { convertKrdToTcx } from "./convert-krd-to-tcx.js";

describe("convertKrdToTcx", () => {
  it("should convert KRD to TCX string when validation passes", async () => {
    // Arrange
    const krd = buildKRD.build();
    const expectedTcxString =
      "<TrainingCenterDatabase>...</TrainingCenterDatabase>";

    const mockTcxWriter = vi
      .fn<TcxWriter>()
      .mockResolvedValue(expectedTcxString);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertKrdToTcx(
      mockTcxWriter,
      mockValidator,
      logger
    )({ krd });

    // Assert
    expect(result).toStrictEqual(expectedTcxString);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
    expect(mockTcxWriter).toHaveBeenCalledWith(krd);
  });

  it("should throw KrdValidationError when pre-validation fails", async () => {
    // Arrange
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockTcxWriter = vi.fn<TcxWriter>();
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToTcx(mockTcxWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertKrdToTcx(mockTcxWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow("KRD validation failed");
    expect(mockTcxWriter).not.toHaveBeenCalled();
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockTcxWriter = vi.fn<TcxWriter>();
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToTcx(mockTcxWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertKrdToTcx(mockTcxWriter, mockValidator, logger)({ krd })
    ).rejects.toMatchObject({
      errors: validationErrors,
    });
  });

  it("should propagate TcxWriter errors", async () => {
    // Arrange
    const krd = buildKRD.build();
    const writerError = new Error("Failed to write TCX file");

    const mockTcxWriter = vi.fn<TcxWriter>().mockRejectedValue(writerError);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToTcx(mockTcxWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(writerError);
  });

  it("should validate KRD before writing to TCX", async () => {
    // Arrange
    const krd = buildKRD.build();
    const tcxString = "<TrainingCenterDatabase>...</TrainingCenterDatabase>";

    const mockTcxWriter = vi.fn<TcxWriter>().mockResolvedValue(tcxString);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    await convertKrdToTcx(mockTcxWriter, mockValidator, logger)({ krd });

    // Assert
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
    expect(mockTcxWriter).toHaveBeenCalledWith(krd);
  });
});

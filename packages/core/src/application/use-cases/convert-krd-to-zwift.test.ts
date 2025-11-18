import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../../domain/types/errors.js";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { ZwiftWriter } from "../../ports/zwift-writer";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { convertKrdToZwift } from "./convert-krd-to-zwift.js";

describe("convertKrdToZwift", () => {
  it("should convert KRD to Zwift string when validation passes", async () => {
    // Arrange
    const krd = buildKRD.build();
    const expectedString = "<workout_file>...</workout_file>";

    const mockZwiftWriter = vi
      .fn<ZwiftWriter>()
      .mockResolvedValue(expectedString);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertKrdToZwift(
      mockZwiftWriter,
      mockValidator,
      logger
    )({ krd });

    // Assert
    expect(result).toStrictEqual(expectedString);
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
    expect(mockZwiftWriter).toHaveBeenCalledWith(krd);
  });

  it("should throw KrdValidationError when pre-validation fails", async () => {
    // Arrange
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockZwiftWriter = vi.fn<ZwiftWriter>();
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToZwift(mockZwiftWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertKrdToZwift(mockZwiftWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow("KRD validation failed");
    expect(mockZwiftWriter).not.toHaveBeenCalled();
  });

  it("should include validation errors in thrown KrdValidationError", async () => {
    // Arrange
    const krd = buildKRD.build();
    const validationErrors = [
      { field: "version", message: "Invalid version format" },
      { field: "type", message: "Invalid type value" },
    ];

    const mockZwiftWriter = vi.fn<ZwiftWriter>();
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToZwift(mockZwiftWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(KrdValidationError);
    await expect(
      convertKrdToZwift(mockZwiftWriter, mockValidator, logger)({ krd })
    ).rejects.toMatchObject({
      errors: validationErrors,
    });
  });

  it("should propagate ZwiftWriter errors", async () => {
    // Arrange
    const krd = buildKRD.build();
    const writerError = new Error("Failed to write Zwift file");

    const mockZwiftWriter = vi.fn<ZwiftWriter>().mockRejectedValue(writerError);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertKrdToZwift(mockZwiftWriter, mockValidator, logger)({ krd })
    ).rejects.toThrow(writerError);
  });

  it("should validate KRD before writing to Zwift", async () => {
    // Arrange
    const krd = buildKRD.build();
    const zwiftString = "<workout_file>...</workout_file>";

    const mockZwiftWriter = vi.fn<ZwiftWriter>().mockResolvedValue(zwiftString);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    await convertKrdToZwift(mockZwiftWriter, mockValidator, logger)({ krd });

    // Assert
    expect(mockValidator.validate).toHaveBeenCalledWith(krd);
    expect(mockZwiftWriter).toHaveBeenCalledWith(krd);
  });
});

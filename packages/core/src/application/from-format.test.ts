import { describe, expect, it, vi } from "vitest";

import { KrdValidationError } from "../domain/types/errors.js";
import type { BinaryReader, TextReader } from "../ports/format-strategy";
import { buildKRD } from "../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../tests/helpers/test-utils.js";
import { fromBinary, fromText } from "./from-format.js";

describe("fromBinary", () => {
  it("should convert binary data to validated KRD", async () => {
    // Arrange
    const buffer = new Uint8Array([1, 2, 3]);
    const expectedKrd = buildKRD.build();
    const reader = vi.fn<BinaryReader>().mockResolvedValue(expectedKrd);

    // Act
    const result = await fromBinary(buffer, reader);

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(reader).toHaveBeenCalledWith(buffer);
  });

  it("should throw KrdValidationError for invalid KRD", async () => {
    // Arrange
    const buffer = new Uint8Array([1, 2, 3]);

    // Act
    const reader = vi
      .fn<BinaryReader>()
      .mockResolvedValue({ invalid: true } as never);

    // Assert
    await expect(fromBinary(buffer, reader)).rejects.toThrow(
      KrdValidationError
    );
  });

  it("should propagate reader errors", async () => {
    // Arrange
    const buffer = new Uint8Array([1, 2, 3]);
    const error = new Error("Read failed");

    // Act
    const reader = vi.fn<BinaryReader>().mockRejectedValue(error);

    // Assert
    await expect(fromBinary(buffer, reader)).rejects.toThrow(error);
  });

  it("should log when logger is provided", async () => {
    // Arrange
    const buffer = new Uint8Array([1, 2, 3]);
    const expectedKrd = buildKRD.build();
    const reader = vi.fn<BinaryReader>().mockResolvedValue(expectedKrd);
    const logger = createMockLogger();
    const infoSpy = vi.spyOn(logger, "info");

    // Act
    await fromBinary(buffer, reader, logger);

    // Assert
    expect(infoSpy).toHaveBeenCalledWith("Converting binary format to KRD");
    expect(infoSpy).toHaveBeenCalledWith("Conversion to KRD successful");
  });

  it("should work without logger", async () => {
    // Arrange
    const buffer = new Uint8Array([1, 2, 3]);
    const expectedKrd = buildKRD.build();
    const reader = vi.fn<BinaryReader>().mockResolvedValue(expectedKrd);

    // Act
    const result = await fromBinary(buffer, reader);

    // Assert
    expect(result).toStrictEqual(expectedKrd);
  });
});

describe("fromText", () => {
  it("should convert text data to validated KRD", async () => {
    // Arrange
    const text = "<xml>data</xml>";
    const expectedKrd = buildKRD.build();
    const reader = vi.fn<TextReader>().mockResolvedValue(expectedKrd);

    // Act
    const result = await fromText(text, reader);

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(reader).toHaveBeenCalledWith(text);
  });

  it("should throw KrdValidationError for invalid KRD", async () => {
    // Arrange
    const text = "<xml>data</xml>";

    // Act
    const reader = vi
      .fn<TextReader>()
      .mockResolvedValue({ invalid: true } as never);

    // Assert
    await expect(fromText(text, reader)).rejects.toThrow(KrdValidationError);
  });

  it("should propagate reader errors", async () => {
    // Arrange
    const text = "<xml>data</xml>";
    const error = new Error("Parse failed");

    // Act
    const reader = vi.fn<TextReader>().mockRejectedValue(error);

    // Assert
    await expect(fromText(text, reader)).rejects.toThrow(error);
  });

  it("should log when logger is provided", async () => {
    // Arrange
    const text = "<xml>data</xml>";
    const expectedKrd = buildKRD.build();
    const reader = vi.fn<TextReader>().mockResolvedValue(expectedKrd);
    const logger = createMockLogger();
    const infoSpy = vi.spyOn(logger, "info");

    // Act
    await fromText(text, reader, logger);

    // Assert
    expect(infoSpy).toHaveBeenCalledWith("Converting text format to KRD");
    expect(infoSpy).toHaveBeenCalledWith("Conversion to KRD successful");
  });
});

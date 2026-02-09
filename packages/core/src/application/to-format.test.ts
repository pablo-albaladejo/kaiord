import { describe, expect, it, vi } from "vitest";
import { KrdValidationError } from "../domain/types/errors.js";
import type { BinaryWriter, TextWriter } from "../ports/format-strategy";
import { buildKRD } from "../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../tests/helpers/test-utils.js";
import { toBinary, toText } from "./to-format.js";

describe("toBinary", () => {
  it("should convert validated KRD to binary output", async () => {
    const krd = buildKRD.build();
    const expectedBuffer = new Uint8Array([1, 2, 3]);
    const writer = vi.fn<BinaryWriter>().mockResolvedValue(expectedBuffer);

    const result = await toBinary(krd, writer);

    expect(result).toStrictEqual(expectedBuffer);
    expect(writer).toHaveBeenCalledWith(krd);
  });

  it("should throw KrdValidationError for invalid KRD", async () => {
    const invalidKrd = { invalid: true } as never;
    const writer = vi.fn<BinaryWriter>().mockResolvedValue(new Uint8Array([1]));

    await expect(toBinary(invalidKrd, writer)).rejects.toThrow(
      KrdValidationError
    );
    expect(writer).not.toHaveBeenCalled();
  });

  it("should propagate writer errors", async () => {
    const krd = buildKRD.build();
    const error = new Error("Write failed");
    const writer = vi.fn<BinaryWriter>().mockRejectedValue(error);

    await expect(toBinary(krd, writer)).rejects.toThrow(error);
  });

  it("should log when logger is provided", async () => {
    const krd = buildKRD.build();
    const writer = vi.fn<BinaryWriter>().mockResolvedValue(new Uint8Array([1]));
    const logger = createMockLogger();
    const infoSpy = vi.spyOn(logger, "info");

    await toBinary(krd, writer, logger);

    expect(infoSpy).toHaveBeenCalledWith("Converting KRD to binary format");
    expect(infoSpy).toHaveBeenCalledWith("Conversion from KRD successful");
  });
});

describe("toText", () => {
  it("should convert validated KRD to text output", async () => {
    const krd = buildKRD.build();
    const expectedXml = "<xml>output</xml>";
    const writer = vi.fn<TextWriter>().mockResolvedValue(expectedXml);

    const result = await toText(krd, writer);

    expect(result).toBe(expectedXml);
    expect(writer).toHaveBeenCalledWith(krd);
  });

  it("should throw KrdValidationError for invalid KRD", async () => {
    const invalidKrd = { invalid: true } as never;
    const writer = vi.fn<TextWriter>().mockResolvedValue("<xml/>");

    await expect(toText(invalidKrd, writer)).rejects.toThrow(
      KrdValidationError
    );
    expect(writer).not.toHaveBeenCalled();
  });

  it("should propagate writer errors", async () => {
    const krd = buildKRD.build();
    const error = new Error("Write failed");
    const writer = vi.fn<TextWriter>().mockRejectedValue(error);

    await expect(toText(krd, writer)).rejects.toThrow(error);
  });

  it("should log when logger is provided", async () => {
    const krd = buildKRD.build();
    const writer = vi.fn<TextWriter>().mockResolvedValue("<xml/>");
    const logger = createMockLogger();
    const infoSpy = vi.spyOn(logger, "info");

    await toText(krd, writer, logger);

    expect(infoSpy).toHaveBeenCalledWith("Converting KRD to text format");
    expect(infoSpy).toHaveBeenCalledWith("Conversion from KRD successful");
  });
});

import { describe, expect, it } from "vitest";

import {
  EXTENSION_TO_FORMAT,
  fileFormatSchema,
  FORMAT_CODES,
  FORMAT_REGISTRY,
  isBinaryFormat,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_FORMAT_CODES,
} from "./format-registry";

describe("FORMAT_REGISTRY", () => {
  it("should expose codes sorted alphabetically", () => {
    // Arrange
    const expected = [...FORMAT_CODES].sort();

    // Act
    const actual = FORMAT_CODES;

    // Assert
    expect(actual).toEqual(expected);
  });

  it("should derive the zod enum from the registry codes", () => {
    // Arrange
    const codes = FORMAT_CODES;

    // Act
    const parsed = codes.map(
      (code) => fileFormatSchema.safeParse(code).success
    );

    // Assert
    expect(parsed.every(Boolean)).toBe(true);
    expect(fileFormatSchema.safeParse("nope").success).toBe(false);
  });

  it("should derive the extension map from the registry", () => {
    // Arrange
    const code = "zwo";

    // Act
    const detected = EXTENSION_TO_FORMAT[FORMAT_REGISTRY[code].extension];

    // Assert
    expect(detected).toBe(code);
  });

  it("should build the supported-extensions string from the registry", () => {
    // Arrange
    const expected = FORMAT_CODES.map(
      (code) => FORMAT_REGISTRY[code].extension
    ).join(", ");

    // Act
    const actual = SUPPORTED_EXTENSIONS;

    // Assert
    expect(actual).toBe(expected);
  });

  it("should build the supported-codes string from the registry", () => {
    // Arrange
    const expected = FORMAT_CODES.join(", ");

    // Act
    const actual = SUPPORTED_FORMAT_CODES;

    // Assert
    expect(actual).toBe(expected);
  });

  it("should report fit as the only binary format", () => {
    // Arrange
    const codes = FORMAT_CODES;

    // Act
    const binaryCodes = codes.filter((code) => isBinaryFormat(code));

    // Assert
    expect(binaryCodes).toEqual(["fit"]);
  });
});

import { describe, expect, it } from "vitest";

import { INVALID_NUMERIC_FORMAT } from "../test-utils/constants";
import { BINARY_FORMATS, formatSchema, isBinaryFormat } from "./tool-schemas";

describe("formatSchema", () => {
  it("should accept valid format values", () => {
    // Arrange

    // Act
    const formats = ["fit", "tcx", "zwo", "gcn", "krd"] as const;

    // Assert
    for (const format of formats) {
      expect(formatSchema.parse(format)).toBe(format);
    }
  });

  it("should reject invalid format values", () => {
    // Arrange

    // Act

    // Assert
    expect(() => formatSchema.parse("invalid")).toThrow();
    expect(() => formatSchema.parse("")).toThrow();
    expect(() => formatSchema.parse(INVALID_NUMERIC_FORMAT)).toThrow();
  });
});

describe("BINARY_FORMATS", () => {
  it("should contain only fit", () => {
    // Arrange

    // Act

    // Assert
    expect(BINARY_FORMATS.has("fit")).toBe(true);
    expect(BINARY_FORMATS.has("tcx")).toBe(false);
    expect(BINARY_FORMATS.has("zwo")).toBe(false);
    expect(BINARY_FORMATS.has("gcn")).toBe(false);
    expect(BINARY_FORMATS.has("krd")).toBe(false);
  });
});

describe("isBinaryFormat", () => {
  it("should return true for FIT format", () => {
    // Arrange

    // Act

    // Assert
    expect(isBinaryFormat("fit")).toBe(true);
  });

  it("should return false for text formats", () => {
    // Arrange

    // Act

    // Assert
    expect(isBinaryFormat("tcx")).toBe(false);
    expect(isBinaryFormat("zwo")).toBe(false);
    expect(isBinaryFormat("gcn")).toBe(false);
    expect(isBinaryFormat("krd")).toBe(false);
  });
});

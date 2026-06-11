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

describe("binary format classification", () => {
  it("should mark only fit as binary in both the set and the predicate", () => {
    // Arrange

    // Act

    // Assert
    expect(BINARY_FORMATS.has("fit")).toBe(true);
    expect(isBinaryFormat("fit")).toBe(true);
  });

  it("should mark text formats as non-binary in both the set and the predicate", () => {
    // Arrange
    const textFormats = ["tcx", "zwo", "gcn", "krd"] as const;

    // Act

    // Assert
    for (const format of textFormats) {
      expect(BINARY_FORMATS.has(format)).toBe(false);
      expect(isBinaryFormat(format)).toBe(false);
    }
  });
});

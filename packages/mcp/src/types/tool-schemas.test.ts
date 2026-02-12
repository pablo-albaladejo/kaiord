import { describe, expect, it } from "vitest";
import { BINARY_FORMATS, formatSchema, isBinaryFormat } from "./tool-schemas";

describe("formatSchema", () => {
  it("should accept valid format values", () => {
    const formats = ["fit", "tcx", "zwo", "gcn", "krd"] as const;

    for (const format of formats) {
      expect(formatSchema.parse(format)).toBe(format);
    }
  });

  it("should reject invalid format values", () => {
    expect(() => formatSchema.parse("invalid")).toThrow();
    expect(() => formatSchema.parse("")).toThrow();
    expect(() => formatSchema.parse(123)).toThrow();
  });
});

describe("BINARY_FORMATS", () => {
  it("should contain only fit", () => {
    expect(BINARY_FORMATS.has("fit")).toBe(true);
    expect(BINARY_FORMATS.has("tcx")).toBe(false);
    expect(BINARY_FORMATS.has("zwo")).toBe(false);
    expect(BINARY_FORMATS.has("gcn")).toBe(false);
    expect(BINARY_FORMATS.has("krd")).toBe(false);
  });
});

describe("isBinaryFormat", () => {
  it("should return true for FIT format", () => {
    expect(isBinaryFormat("fit")).toBe(true);
  });

  it("should return false for text formats", () => {
    expect(isBinaryFormat("tcx")).toBe(false);
    expect(isBinaryFormat("zwo")).toBe(false);
    expect(isBinaryFormat("gcn")).toBe(false);
    expect(isBinaryFormat("krd")).toBe(false);
  });
});

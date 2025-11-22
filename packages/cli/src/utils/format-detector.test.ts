import { describe, expect, it } from "vitest";
import {
  detectFormat,
  fileFormatSchema,
  validateFormat,
} from "./format-detector";

describe("detectFormat", () => {
  it("should detect FIT format from .fit extension", () => {
    // Arrange & Act
    const result = detectFormat("workout.fit");

    // Assert
    expect(result).toBe("fit");
  });

  it("should detect KRD format from .krd extension", () => {
    // Arrange & Act
    const result = detectFormat("workout.krd");

    // Assert
    expect(result).toBe("krd");
  });

  it("should detect TCX format from .tcx extension", () => {
    // Arrange & Act
    const result = detectFormat("workout.tcx");

    // Assert
    expect(result).toBe("tcx");
  });

  it("should detect ZWO format from .zwo extension", () => {
    // Arrange & Act
    const result = detectFormat("workout.zwo");

    // Assert
    expect(result).toBe("zwo");
  });

  it("should handle uppercase extensions", () => {
    // Arrange & Act
    const result = detectFormat("workout.FIT");

    // Assert
    expect(result).toBe("fit");
  });

  it("should handle paths with directories", () => {
    // Arrange & Act
    const result = detectFormat("/path/to/workout.krd");

    // Assert
    expect(result).toBe("krd");
  });

  it("should return null for unknown extensions", () => {
    // Arrange & Act
    const result = detectFormat("workout.txt");

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for files without extensions", () => {
    // Arrange & Act
    const result = detectFormat("workout");

    // Assert
    expect(result).toBeNull();
  });
});

describe("validateFormat", () => {
  it("should validate fit as valid format", () => {
    // Arrange & Act
    const result = validateFormat("fit");

    // Assert
    expect(result).toBe(true);
  });

  it("should validate krd as valid format", () => {
    // Arrange & Act
    const result = validateFormat("krd");

    // Assert
    expect(result).toBe(true);
  });

  it("should validate tcx as valid format", () => {
    // Arrange & Act
    const result = validateFormat("tcx");

    // Assert
    expect(result).toBe(true);
  });

  it("should validate zwo as valid format", () => {
    // Arrange & Act
    const result = validateFormat("zwo");

    // Assert
    expect(result).toBe(true);
  });

  it("should reject invalid format strings", () => {
    // Arrange & Act
    const result = validateFormat("invalid");

    // Assert
    expect(result).toBe(false);
  });

  it("should reject empty strings", () => {
    // Arrange & Act
    const result = validateFormat("");

    // Assert
    expect(result).toBe(false);
  });
});

describe("fileFormatSchema", () => {
  it("should parse valid format strings", () => {
    // Arrange & Act
    const result = fileFormatSchema.safeParse("fit");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("fit");
    }
  });

  it("should reject invalid format strings", () => {
    // Arrange & Act
    const result = fileFormatSchema.safeParse("invalid");

    // Assert
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { detectFormat } from "./format-detector";

describe("detectFormat", () => {
  it.each([
    ["workout.fit", "fit"],
    ["workout.krd", "krd"],
    ["workout.tcx", "tcx"],
    ["workout.zwo", "zwo"],
  ] as const)("should detect %s as %s", (path, expected) => {
    // Arrange

    // Act
    const result = detectFormat(path);

    // Assert
    expect(result).toBe(expected);
  });

  it("should handle uppercase extensions", () => {
    // Arrange

    // Act
    const result = detectFormat("workout.FIT");

    // Assert
    expect(result).toBe("fit");
  });

  it("should handle paths with directories", () => {
    // Arrange

    // Act
    const result = detectFormat("/path/to/workout.krd");

    // Assert
    expect(result).toBe("krd");
  });

  it("should return null for unknown extensions", () => {
    // Arrange

    // Act
    const result = detectFormat("workout.txt");

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for files without extensions", () => {
    // Arrange

    // Act
    const result = detectFormat("workout");

    // Assert
    expect(result).toBeNull();
  });
});

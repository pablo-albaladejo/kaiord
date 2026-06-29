import { describe, expect, it } from "vitest";

import { FORMAT_COUNT_FIVE } from "../test-utils/constants";
import { detectFormatFromPath, FORMAT_REGISTRY } from "./format-registry";

describe("FORMAT_REGISTRY", () => {
  it("should have entries for all five formats", () => {
    // Arrange

    // Act
    const keys = Object.keys(FORMAT_REGISTRY);

    // Assert
    expect(keys).toContain("fit");
    expect(keys).toContain("tcx");
    expect(keys).toContain("zwo");
    expect(keys).toContain("gcn");
    expect(keys).toContain("krd");
    expect(keys).toHaveLength(FORMAT_COUNT_FIVE);
  });

  it("should mark FIT as binary", () => {
    // Arrange

    // Act

    // Assert
    expect(FORMAT_REGISTRY.fit.binary).toBe(true);
  });

  it("should mark text formats as non-binary", () => {
    // Arrange

    // Act

    // Assert
    expect(FORMAT_REGISTRY.tcx.binary).toBe(false);
    expect(FORMAT_REGISTRY.zwo.binary).toBe(false);
    expect(FORMAT_REGISTRY.gcn.binary).toBe(false);
    expect(FORMAT_REGISTRY.krd.binary).toBe(false);
  });

  it("should have correct extensions", () => {
    // Arrange

    // Act

    // Assert
    expect(FORMAT_REGISTRY.fit.extension).toBe(".fit");
    expect(FORMAT_REGISTRY.tcx.extension).toBe(".tcx");
    expect(FORMAT_REGISTRY.zwo.extension).toBe(".zwo");
    expect(FORMAT_REGISTRY.gcn.extension).toBe(".gcn");
    expect(FORMAT_REGISTRY.krd.extension).toBe(".krd");
  });
});

describe("detectFormatFromPath", () => {
  it.each([
    ["/path/to/file.fit", "fit"],
    ["/path/to/file.tcx", "tcx"],
    ["workout.zwo", "zwo"],
    ["workout.gcn", "gcn"],
    ["data.krd", "krd"],
  ] as const)("should detect %s as %s", (path, expected) => {
    // Arrange

    // Act
    const result = detectFormatFromPath(path);

    // Assert
    expect(result).toBe(expected);
  });

  it("should be case-insensitive for extensions", () => {
    // Arrange

    // Act

    // Assert
    expect(detectFormatFromPath("file.FIT")).toBe("fit");
    expect(detectFormatFromPath("file.Tcx")).toBe("tcx");
  });

  it("should return null for unknown extensions", () => {
    // Arrange

    // Act

    // Assert
    expect(detectFormatFromPath("file.txt")).toBeNull();
    expect(detectFormatFromPath("file.json")).toBeNull();
  });

  it.each(["noextension", "fit", "tcx"])(
    "should return null when path has no extension: %s",
    (path) => {
      // Arrange

      // Act
      const result = detectFormatFromPath(path);

      // Assert
      expect(result).toBeNull();
    }
  );
});

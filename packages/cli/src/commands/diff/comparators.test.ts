import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { compareExtensions, compareMetadata, isDifferent } from "./comparators";

const krdWith = (overrides: Partial<KRD>): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    ...overrides,
  }) as KRD;

describe("isDifferent", () => {
  it.each([
    ["identical primitives", 1, 1, false],
    ["different primitives", 1, 2, true],
    ["null against a value", null, 1, true],
    ["a value against undefined", 1, undefined, true],
    ["structurally equal objects", { a: 1 }, { a: 1 }, false],
    ["structurally different objects", { a: 1 }, { a: 2 }, true],
    ["an object against a primitive", { a: 1 }, "x", true],
  ])("should compare %s", (_label, value1, value2, expected) => {
    // Arrange
    const pair = [value1, value2] as const;

    // Act
    const result = isDifferent(pair[0], pair[1]);

    // Assert
    expect(result).toBe(expected);
  });
});

describe("compareMetadata", () => {
  it("should return no differences for equal metadata", () => {
    // Arrange
    const krd1 = krdWith({});
    const krd2 = krdWith({});

    // Act
    const diffs = compareMetadata(krd1, krd2);

    // Assert
    expect(diffs).toEqual([]);
  });

  it("should report each differing and missing metadata field", () => {
    // Arrange
    const krd1 = krdWith({
      metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    });
    const krd2 = krdWith({
      metadata: {
        created: "2025-01-01T00:00:00Z",
        sport: "running",
        manufacturer: "garmin",
      },
    });

    // Act
    const diffs = compareMetadata(krd1, krd2);

    // Assert
    expect(diffs).toEqual([
      { field: "manufacturer", file1Value: undefined, file2Value: "garmin" },
      { field: "sport", file1Value: "cycling", file2Value: "running" },
    ]);
  });
});

describe("compareExtensions", () => {
  it("should treat missing extensions on both sides as equal", () => {
    // Arrange
    const krd1 = krdWith({});
    const krd2 = krdWith({});

    // Act
    const result = compareExtensions(krd1, krd2);

    // Assert
    expect(result).toEqual({ file1Keys: [], file2Keys: [], differences: [] });
  });

  it("should report keys that differ or exist on one side only", () => {
    // Arrange
    const krd1 = krdWith({ extensions: { shared: { a: 1 }, onlyLeft: 1 } });
    const krd2 = krdWith({ extensions: { shared: { a: 2 } } });

    // Act
    const result = compareExtensions(krd1, krd2);

    // Assert
    expect(result.file1Keys).toEqual(["shared", "onlyLeft"]);
    expect(result.file2Keys).toEqual(["shared"]);
    expect(result.differences).toEqual([
      { key: "shared", file1Value: { a: 1 }, file2Value: { a: 2 } },
      { key: "onlyLeft", file1Value: 1, file2Value: undefined },
    ]);
  });
});

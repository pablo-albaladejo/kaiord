import type { LabFlag } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { isOutOfRange, LAB_FLAG_STYLES } from "./lab-flag-display";

describe("isOutOfRange", () => {
  it("should mark low and high as out of range", () => {
    // Arrange
    const flags: LabFlag[] = ["low", "high"];

    // Act
    const results = flags.map(isOutOfRange);

    // Assert
    expect(results).toEqual([true, true]);
  });

  it("should not mark in-range or unknown as out of range", () => {
    // Arrange
    const flags: LabFlag[] = ["in", "unknown"];

    // Act
    const results = flags.map(isOutOfRange);

    // Assert
    expect(results).toEqual([false, false]);
  });
});

describe("LAB_FLAG_STYLES", () => {
  it("should provide a label and classes for every flag", () => {
    // Arrange
    const flags: LabFlag[] = ["in", "low", "high", "unknown"];

    // Act
    const complete = flags.every(
      (f) =>
        LAB_FLAG_STYLES[f].label !== "" && LAB_FLAG_STYLES[f].className !== ""
    );

    // Assert
    expect(complete).toBe(true);
  });
});

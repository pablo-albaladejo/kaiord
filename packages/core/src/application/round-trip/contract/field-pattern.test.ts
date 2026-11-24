import { describe, expect, it } from "vitest";

import { matchesField } from "./field-pattern";

describe("matchesField", () => {
  it("should match a field exactly, one segment with *, and any depth with **", () => {
    // Arrange
    const path = "extensions.structured_workout.steps.1.steps.0.notes";

    // Act
    const results = [
      matchesField(path, path),
      matchesField(path, "extensions.structured_workout.steps.*.steps.*.notes"),
      matchesField(path, "extensions.structured_workout.**.notes"),
      matchesField(path, "**.notes"),
      matchesField(path, "**.name"),
      matchesField(path, "extensions.*.notes"),
      matchesField("extensions.fit", "extensions.fit.**"),
    ];

    // Assert
    expect(results).toEqual([true, true, true, true, false, false, true]);
  });
});

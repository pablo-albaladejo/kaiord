import { describe, expect, it } from "vitest";

import { parseGarminWorkoutId } from "./garmin-push-id";

describe("parseGarminWorkoutId", () => {
  it("should return the workoutId string from a push response", () => {
    // Arrange
    const data = { workoutId: "123456789" };

    // Act
    const result = parseGarminWorkoutId(data);

    // Assert
    expect(result).toBe("123456789");
  });

  it("should stringify a numeric workoutId", () => {
    // Arrange
    const data = { workoutId: 987654321 };

    // Act
    const result = parseGarminWorkoutId(data);

    // Assert
    expect(result).toBe("987654321");
  });

  it.each([
    { label: "null payload", data: null },
    { label: "non-object payload", data: "workout" },
    { label: "missing workoutId", data: { name: "w" } },
    { label: "empty workoutId", data: { workoutId: "" } },
    { label: "non-finite workoutId", data: { workoutId: Number.NaN } },
  ])("should return null for $label", ({ data }) => {
    // Arrange

    // Act
    const result = parseGarminWorkoutId(data);

    // Assert
    expect(result).toBeNull();
  });
});

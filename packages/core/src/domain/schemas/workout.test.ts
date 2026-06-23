import { describe, expect, it } from "vitest";

import { workoutSchema } from "./workout";

describe("workoutSchema workout-level notes", () => {
  it("should accept an optional workout-level notes string", () => {
    // Arrange
    const workout = {
      sport: "cycling",
      notes: "Warmup Z1 — see [video](https://youtu.be/abc)",
      steps: [],
    };

    // Act
    const result = workoutSchema.safeParse(workout);

    // Assert
    expect(result.success).toBe(true);
    expect(result.success && result.data.notes).toBe(
      "Warmup Z1 — see [video](https://youtu.be/abc)"
    );
  });

  it("should leave notes undefined when omitted", () => {
    // Arrange
    const workout = { sport: "running", steps: [] };

    // Act
    const result = workoutSchema.safeParse(workout);

    // Assert
    expect(result.success).toBe(true);
    expect(result.success && result.data.notes).toBeUndefined();
  });

  it("should reject a non-string notes value", () => {
    // Arrange
    const workout = { sport: "cycling", notes: 42, steps: [] };

    // Act
    const result = workoutSchema.safeParse(workout);

    // Assert
    expect(result.success).toBe(false);
  });
});

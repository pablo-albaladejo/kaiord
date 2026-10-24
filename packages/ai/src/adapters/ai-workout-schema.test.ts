import { describe, it, expect } from "vitest";
import { aiWorkoutSchema } from "./ai-workout-schema";

const workoutWithTargetValue = (value: Record<string, unknown>) => ({
  sport: "cycling",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 900 },
      targetType: "power",
      target: { type: "power", value },
      intensity: "active",
    },
  ],
});

describe("aiWorkoutSchema", () => {
  it("should keep the percent_ftp basis of a power range", () => {
    // Arrange
    const raw = workoutWithTargetValue({
      unit: "range",
      min: 88,
      max: 93,
      basis: "percent_ftp",
    });

    // Act
    const parsed = aiWorkoutSchema.parse(raw);

    // Assert
    expect(parsed.steps[0]).toMatchObject({
      target: { value: { unit: "range", basis: "percent_ftp" } },
    });
  });

  it("should reject a basis other than percent_ftp", () => {
    // Arrange
    const raw = workoutWithTargetValue({ unit: "range", basis: "watts" });

    // Act
    const result = aiWorkoutSchema.safeParse(raw);

    // Assert
    expect(result.success).toBe(false);
  });
});

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

  it("should carry the coach's literal numbers through to the code that computes", () => {
    // Arrange
    const pace = { unit: "pace", per: "km", clock: "4:45", clockTo: "4:50" };
    const reference = { unit: "reference", reference: "10k" };
    const raw = {
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", hours: 1, minutes: 5, seconds: 30 },
          targetType: "pace",
          target: { type: "pace", value: pace },
          intensity: "active",
        },
        {
          fill: { type: "time", minutes: 30 },
          steps: [
            {
              stepIndex: 0,
              durationType: "distance",
              duration: { type: "distance", kilometers: 1, miles: 1 },
              targetType: "pace",
              target: { type: "pace", value: reference },
              intensity: "interval",
            },
          ],
        },
      ],
    };

    // Act
    const parsed = aiWorkoutSchema.parse(raw);

    // Assert
    expect(parsed).toEqual(raw);
  });
});

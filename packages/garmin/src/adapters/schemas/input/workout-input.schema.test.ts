import { describe, expect, it } from "vitest";

import { garminWorkoutInputSchema } from "./workout-input.schema";

const baseMultisportInput = {
  sportType: { sportTypeId: 10, sportTypeKey: "multi_sport" as const },
  workoutName: "Test Multisport Brick",
  workoutSegments: [
    {
      segmentOrder: 1,
      sportType: { sportTypeId: 1, sportTypeKey: "running" as const },
      workoutSteps: [
        {
          type: "ExecutableStepDTO" as const,
          stepOrder: 1,
          stepType: {
            stepTypeId: 3,
            stepTypeKey: "interval" as const,
            displayOrder: 3,
          },
          endCondition: {
            conditionTypeId: 3,
            conditionTypeKey: "distance" as const,
            displayOrder: 3,
            displayable: true,
          },
          endConditionValue: 400,
          targetType: {
            workoutTargetTypeId: 1,
            workoutTargetTypeKey: "no.target" as const,
            displayOrder: 1,
          },
        },
      ],
    },
  ],
};

describe("garminWorkoutInputSchema isSessionTransitionEnabled", () => {
  it.each([[true], [false]])(
    "should accept a multisport input with isSessionTransitionEnabled %s",
    (isSessionTransitionEnabled) => {
      // Arrange
      const input = { ...baseMultisportInput, isSessionTransitionEnabled };

      // Act
      const result = garminWorkoutInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isSessionTransitionEnabled).toBe(
          isSessionTransitionEnabled
        );
      }
    }
  );

  it("should accept a workout input without the isSessionTransitionEnabled field", () => {
    // Arrange
    const input = baseMultisportInput;

    // Act
    const result = garminWorkoutInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isSessionTransitionEnabled).toBeUndefined();
    }
  });
});

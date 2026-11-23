import { describe, expect, it } from "vitest";

import { sourceValuesOf } from "./source-values";

describe("sourceValuesOf", () => {
  it("should list every leaf by its path without array positions, with the records around it", () => {
    // Arrange
    const duration = { Seconds: 60 };
    const step = { "@_type": "Step_t", Name: "Warm up", Duration: duration };
    const cool = { Name: "Cool down" };
    const workout = { Step: [step, cool] };
    const tree = { Workout: workout };

    // Act
    const values = sourceValuesOf(tree);

    // Assert
    expect(values).toEqual([
      {
        field: "Workout.Step.@_type",
        value: "Step_t",
        context: step,
        ancestors: [tree, workout, step],
      },
      {
        field: "Workout.Step.Name",
        value: "Warm up",
        context: step,
        ancestors: [tree, workout, step],
      },
      {
        field: "Workout.Step.Duration.Seconds",
        value: 60,
        context: duration,
        ancestors: [tree, workout, step, duration],
      },
      {
        field: "Workout.Step.Name",
        value: "Cool down",
        context: cool,
        ancestors: [tree, workout, cool],
      },
    ]);
  });
});

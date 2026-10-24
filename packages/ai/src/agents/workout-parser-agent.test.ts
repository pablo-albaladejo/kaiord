import { describe, expect, it } from "vitest";

import { createWorkoutParserAgent } from "./workout-parser-agent";

const rawStep = (type: string, value: Record<string, unknown>) => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: type,
  target: { type, value },
  intensity: "active",
});

const rawWorkout = (...steps: Array<unknown>) => ({
  sport: "cycling",
  steps,
});

describe("createWorkoutParserAgent validate", () => {
  it("should keep the basis of a power range", () => {
    // Arrange
    const power = { unit: "range", min: 88, max: 93, basis: "percent_ftp" };
    const agent = createWorkoutParserAgent("");

    // Act
    const workout = agent.validate(rawWorkout(rawStep("power", power)));

    // Assert
    expect(workout.steps[0]).toMatchObject({ target: { value: power } });
  });

  it("should reject a basis on a non-power target so the retry corrects it", () => {
    // Arrange
    const hr = { unit: "range", min: 130, max: 150, basis: "percent_ftp" };
    const agent = createWorkoutParserAgent("");
    const raw = rawWorkout(rawStep("heart_rate", hr));

    // Act
    const validate = () => agent.validate(raw);

    // Assert
    expect(validate).toThrow(/basis is only valid on a power target/);
  });

  it("should reject a basis on a non-power step inside a repetition block", () => {
    // Arrange
    const pace = { unit: "range", min: 3, max: 4, basis: "percent_ftp" };
    const agent = createWorkoutParserAgent("");
    const raw = rawWorkout({
      repeatCount: 2,
      steps: [rawStep("pace", pace)],
    });

    // Act
    const validate = () => agent.validate(raw);

    // Assert
    expect(validate).toThrow(/a pace target carries basis percent_ftp/);
  });
});

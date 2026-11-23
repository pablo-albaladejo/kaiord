import { describe, expect, it } from "vitest";

import { rawStep, rawWorkout } from "../test-utils/raw-workout";
import { createWorkoutParserAgent } from "./workout-parser-agent";

const PACE_ZONES = {
  pace: [
    { zone: 3, minMps: 3.175, maxMps: 3.448 },
    { zone: 4, minMps: 3.448, maxMps: 3.774 },
    { zone: 5, minMps: 3.774, maxMps: 4.255 },
  ],
};

describe("createWorkoutParserAgent validate: the code computes", () => {
  it("should refuse a speed the model computed in m/s", () => {
    // Arrange
    const agent = createWorkoutParserAgent("");
    const raw = rawWorkout(
      "running",
      rawStep({ type: "time", seconds: 600 }, { unit: "mps", value: 3.7 })
    );

    // Act
    const validate = () => agent.validate(raw);

    // Assert
    expect(validate).toThrow(
      /step 0: a pace in m\/s is computed, not written by the coach/
    );
  });

  it("should refuse a computed speed inside a repetition block", () => {
    // Arrange
    const agent = createWorkoutParserAgent("");
    const pace = { unit: "range", min: 3.4, max: 3.5 };
    const raw = rawWorkout("running", {
      repeatCount: 2,
      steps: [rawStep({ type: "time", seconds: 60 }, pace)],
    });

    // Act
    const validate = () => agent.validate(raw);

    // Assert
    expect(validate).toThrow(/a pace range in m\/s is computed/);
  });

  it("should compute the duration and pace of a step from the coach's numbers", () => {
    // Arrange
    const agent = createWorkoutParserAgent("");
    const raw = rawWorkout(
      "running",
      rawStep(
        { type: "time", minutes: 20 },
        { unit: "pace", per: "km", clock: "4:30" }
      )
    );

    // Act
    const workout = agent.validate(raw);

    // Assert
    expect(workout.steps[0]).toMatchObject({
      duration: { type: "time", seconds: 1200 },
      target: { type: "pace", value: { unit: "mps", value: 3.704 } },
    });
  });

  it("should put the athlete's pace range on a pace named by reference", () => {
    // Arrange
    const agent = createWorkoutParserAgent("", PACE_ZONES);
    const raw = rawWorkout(
      "running",
      rawStep(
        { type: "distance", kilometers: 1 },
        { unit: "reference", reference: "10k" }
      )
    );

    // Act
    const workout = agent.validate(raw);

    // Assert
    expect(workout.steps[0]).toMatchObject({
      duration: { type: "distance", meters: 1000 },
      target: {
        type: "pace",
        value: { unit: "range", min: 3.448, max: 4.255 },
      },
    });
  });
});

import { describe, expect, it } from "vitest";
import { createTextToWorkout } from "./text-to-workout";
import { mockModelReturning } from "../test-utils/mock-language-model";

const step = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 720 },
  targetType: "heart_rate",
  target: { type: "heart_rate", value: { unit: "zone", value: 1 } },
  intensity: "warmup",
};

const parseWith = (output: unknown) =>
  createTextToWorkout({ model: mockModelReturning(output), maxRetries: 0 })(
    "Rodaje 12' z1 RPE 2-3"
  );

describe("createTextToWorkout workout name", () => {
  it("should keep the name the model generated", async () => {
    // Arrange
    const output = {
      name: "Rodaje con contrastes",
      sport: "running",
      steps: [step],
    };

    // Act
    const workout = await parseWith(output);

    // Assert
    expect(workout.name).toBe("Rodaje con contrastes");
  });

  it("should trim surrounding whitespace from the generated name", async () => {
    // Arrange
    const output = {
      name: "  Easy Z2 ride \n",
      sport: "running",
      steps: [step],
    };

    // Act
    const workout = await parseWith(output);

    // Assert
    expect(workout.name).toBe("Easy Z2 ride");
  });

  it("should drop a blank generated name so callers can fall back", async () => {
    // Arrange
    const output = { name: "   ", sport: "running", steps: [step] };

    // Act
    const workout = await parseWith(output);

    // Assert
    expect(workout).not.toHaveProperty("name");
  });

  it("should let an explicit name option override the generated one", async () => {
    // Arrange
    const model = mockModelReturning({
      name: "Generated",
      sport: "running",
      steps: [step],
    });

    // Act
    const workout = await createTextToWorkout({ model, maxRetries: 0 })(
      "Easy run",
      { name: "Chosen" }
    );

    // Assert
    expect(workout.name).toBe("Chosen");
  });

  it("should ask the model for a name in the structured-output schema", async () => {
    // Arrange
    const model = mockModelReturning({ sport: "running", steps: [step] });

    // Act
    await createTextToWorkout({ model, maxRetries: 0 })("Easy run");

    // Assert
    const format = model.doGenerateCalls[0]?.responseFormat;
    expect(format).toMatchObject({
      type: "json",
      schema: { properties: { name: { type: "string" } } },
    });
  });
});

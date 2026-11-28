import { STEP_NOTE_MAX } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { assertBasisOnPowerOnly } from "./assert-basis-on-power";
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
    expect(validate).toThrow(
      "step 0: basis is only valid on a power range, but a heart_rate range target carries basis percent_ftp"
    );
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
    expect(validate).toThrow(/a pace range target carries basis percent_ftp/);
  });

  it("should reject a basis on a power value that is not a range", () => {
    // Arrange
    const watts = { unit: "watts", value: 85, basis: "percent_ftp" };
    const agent = createWorkoutParserAgent("");
    const raw = rawWorkout(rawStep("power", watts));

    // Act
    const validate = () => agent.validate(raw);

    // Assert
    expect(validate).toThrow(/a power watts target carries basis/);
  });

  it("should keep a power range basis inside a repetition block", () => {
    // Arrange
    const power = { unit: "range", min: 88, max: 93, basis: "percent_ftp" };
    const agent = createWorkoutParserAgent("");
    const raw = rawWorkout({
      repeatCount: 3,
      steps: [rawStep("power", power)],
    });

    // Act
    const workout = agent.validate(raw);

    // Assert
    expect(workout.steps[0]).toMatchObject({
      steps: [{ target: { value: power } }],
    });
  });

  it("should accept a heart-rate range without a basis", () => {
    // Arrange
    const hr = { unit: "range", min: 130, max: 150 };
    const agent = createWorkoutParserAgent("");

    // Act
    const workout = agent.validate(rawWorkout(rawStep("heart_rate", hr)));

    // Assert
    expect(workout.steps[0]).toMatchObject({ target: { value: hr } });
  });

  it("should skip a null step in the basis check and leave it to the schema", () => {
    // Arrange
    const raw = rawWorkout(null, { repeatCount: 2, steps: [null] });

    // Act
    const check = () => assertBasisOnPowerOnly(raw);

    // Assert
    expect(check).not.toThrow();
  });
});

describe("createWorkoutParserAgent step notes", () => {
  const throughWire = (raw: unknown) => {
    const agent = createWorkoutParserAgent("");
    return agent.validate(agent.outputSchema.parse(raw));
  };
  const noted = (notes: string, noteOrigin?: string) => ({
    ...rawStep("open", {}),
    target: { type: "open" },
    notes,
    ...(noteOrigin ? { noteOrigin } : {}),
  });

  it("should keep the coach's cue on each step through the wire schema", () => {
    // Arrange
    const raw = rawWorkout({
      repeatCount: 3,
      steps: [noted("Pedaleo a una pierna")],
    });

    // Act
    const workout = throughWire(raw);

    // Assert
    expect(workout.steps[0]).toMatchObject({
      steps: [{ notes: "Pedaleo a una pierna" }],
    });
  });

  it("should mark a note the AI wrote on its own and not a coach's cue", () => {
    // Arrange
    const raw = rawWorkout(
      noted("Spin easy", "ai"),
      noted("Stay seated", "coach")
    );

    // Act
    const workout = throughWire(raw);

    // Assert
    expect(workout.steps[0]).toMatchObject({
      notes: "Spin easy",
      extensions: { kaiord: { noteOrigin: "ai" } },
    });
    expect(workout.steps[1]).not.toHaveProperty("extensions");
    expect(workout.steps[1]).not.toHaveProperty("noteOrigin");
  });

  it("should cut a note longer than a step holds to the step's limit", () => {
    // Arrange
    const raw = rawWorkout(noted("n".repeat(STEP_NOTE_MAX * 2)));

    // Act
    const workout = throughWire(raw);

    // Assert
    expect(workout.steps[0]).toMatchObject({
      notes: "n".repeat(STEP_NOTE_MAX),
    });
  });
});

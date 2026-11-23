import type { Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { evaluateBenchmark } from "./assertions";
import type { Benchmark } from "./types";

const COMPUTED_MPS = 3.704;
const MODEL_ROUNDED_MPS = 3.7;

const BENCHMARK: Benchmark = {
  id: "numbers-unit",
  text: "20 min at 4:30/km, then 90 s easy",
  expectedSport: "running",
  minSteps: 1,
  maxSteps: 5,
  category: "pace",
  language: "en",
  expectedNumbers: [
    { intensity: "active", seconds: 1200, paceMps: 3.704 },
    { intensity: "recovery", seconds: 90 },
  ],
};

const workout = (activeMps: number): Workout => ({
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 1200 },
      targetType: "pace",
      target: { type: "pace", value: { unit: "mps", value: activeMps } },
      intensity: "active",
    },
    {
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 90 },
      targetType: "open",
      target: { type: "open" },
      intensity: "recovery",
    },
  ],
});

const numbersOf = (w: Workout, b: Benchmark = BENCHMARK) =>
  evaluateBenchmark(b, w, 0).outcomes.find((o) => o.dimension === "numbers");

describe("the numbers dimension", () => {
  it("should pass when every expected number is on a step", () => {
    // Arrange
    const right = workout(COMPUTED_MPS);

    // Act
    const outcome = numbersOf(right);

    // Assert
    expect(outcome).toEqual({ dimension: "numbers", status: "passed" });
  });

  it("should fail on a pace one rounding step away from the computed one", () => {
    // Arrange
    const computedByAModel = workout(MODEL_ROUNDED_MPS);

    // Act
    const outcome = numbersOf(computedByAModel);

    // Assert
    expect(outcome).toMatchObject({ status: "failed" });
    expect(outcome).toMatchObject({
      message: expect.stringContaining("paceMps 3.704"),
    });
  });

  it("should report the dimension unmeasured when the benchmark expects no numbers", () => {
    // Arrange
    const withoutNumbers = { ...BENCHMARK, expectedNumbers: undefined };

    // Act
    const outcome = numbersOf(workout(COMPUTED_MPS), withoutNumbers);

    // Assert
    expect(outcome).toEqual({
      dimension: "numbers",
      status: "unmeasured",
      reason: "benchmark declares no expectedNumbers",
    });
  });

  it("should compare a pace range bound by bound", () => {
    // Arrange
    const ranged: Benchmark = {
      ...BENCHMARK,
      expectedNumbers: [{ paceRange: { min: 3.448, max: 3.509 } }],
    };
    const w = workout(COMPUTED_MPS);
    const step = w.steps[0] as { target: unknown };
    step.target = {
      type: "pace",
      value: { unit: "range", min: 3.448, max: 3.509 },
    };

    // Act
    const outcome = numbersOf(w, ranged);

    // Assert
    expect(outcome).toEqual({ dimension: "numbers", status: "passed" });
  });
});

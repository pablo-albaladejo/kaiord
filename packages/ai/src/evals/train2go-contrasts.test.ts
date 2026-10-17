import type { Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createTextToWorkout } from "../adapters/text-to-workout";
import { mockModelReturning } from "../test-utils/mock-language-model";
import {
  TRAIN2GO_CONTRASTS_MODEL_OUTPUT,
  TRAIN2GO_CONTRASTS_PRE_FIX_OUTPUT,
} from "../test-utils/train2go-contrasts";
import { evaluateBenchmark } from "./assertions";
import benchmarks from "./benchmarks.json";
import type { Benchmark } from "./types";

const BENCHMARK = (benchmarks as Array<Benchmark>).find(
  (b) => b.id === "es-train2go-contrasts"
)!;

const range = (value: { min: number; max: number }) => ({
  type: "pace",
  value: { unit: "range", ...value },
});

const Z1 = range({ min: 2.564, max: 2.899 });
const Z2 = range({ min: 2.899, max: 3.175 });
const Z2_TO_Z5 = range({ min: 2.899, max: 4.255 });
const Z4_TO_Z5 = range({ min: 3.448, max: 4.255 });

const generate = async () => {
  const model = mockModelReturning(TRAIN2GO_CONTRASTS_MODEL_OUTPUT);
  const textToWorkout = createTextToWorkout({ model, maxRetries: 0 });
  const workout = await textToWorkout(BENCHMARK.text, {
    sport: "running",
    athlete: { zones: BENCHMARK.athleteZones, zonesText: "Pace zones: Z1…" },
  });
  return { model, workout };
};

const targetsOf = (workout: Workout) =>
  workout.steps.map((s) =>
    "repeatCount" in s
      ? { repeat: s.repeatCount, steps: s.steps.map((i) => i.target) }
      : s.target
  );

describe("Train2Go contrasts session (keyless, MockLanguageModelV4)", () => {
  it("should resolve every running step to the athlete's pace range", async () => {
    // Arrange

    // Act
    const { workout } = await generate();

    // Assert
    expect(targetsOf(workout)).toEqual([
      Z1,
      Z2,
      { repeat: 4, steps: [Z2_TO_Z5, Z1] },
      Z1,
      { repeat: 8, steps: [Z4_TO_Z5, Z1, Z4_TO_Z5, Z1] },
      Z1,
    ]);
  });

  it("should pass every measured dimension of its benchmark", async () => {
    // Arrange
    const { workout } = await generate();

    // Act
    const result = evaluateBenchmark(BENCHMARK, workout, 0);

    // Assert
    expect(result.errors).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it("should send the athlete's zones to the model", async () => {
    // Arrange

    // Act
    const { model } = await generate();

    // Assert
    const prompt = JSON.stringify(model.doGenerateCalls[0]?.prompt);
    expect(prompt).toContain("<athlete_zones>");
    expect(prompt).toContain("cambio fuerte");
  });

  it("should fail the targets dimension on the pre-fix open targets", () => {
    // Arrange
    const workout = TRAIN2GO_CONTRASTS_PRE_FIX_OUTPUT as unknown as Workout;

    // Act
    const result = evaluateBenchmark(BENCHMARK, workout, 0);

    // Assert
    const targets = result.outcomes.find((o) => o.dimension === "targets");
    expect(targets?.status).toBe("failed");
    expect(result.pass).toBe(false);
  });
});

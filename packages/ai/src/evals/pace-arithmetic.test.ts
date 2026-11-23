import type { Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createTextToWorkout } from "../adapters/text-to-workout";
import { AiParsingError } from "../errors";
import { mockModelReturning } from "../test-utils/mock-language-model";
import { PACE_ARITHMETIC_MODEL_OUTPUTS } from "../test-utils/pace-arithmetic-outputs";
import { evaluateBenchmark } from "./assertions";
import benchmarks from "./benchmarks.json";
import type { Benchmark } from "./types";

const PACE_CASES = (benchmarks as Array<Benchmark>).filter(
  (b) => b.category === "pace"
);

const generate = async (benchmark: Benchmark, output: unknown) => {
  const model = mockModelReturning(output);
  const textToWorkout = createTextToWorkout({ model, maxRetries: 0 });
  return textToWorkout(benchmark.text, {
    sport: benchmark.expectedSport as never,
    athlete: benchmark.athleteZones
      ? { zones: benchmark.athleteZones }
      : undefined,
  });
};

const byId = (id: string) => PACE_CASES.find((b) => b.id === id)!;

describe("pace-arithmetic benchmarks (keyless, MockLanguageModelV4)", () => {
  it("should hold a rule-following output for every pace benchmark", () => {
    // Arrange
    const ids = PACE_CASES.map((b) => b.id);

    // Act
    const covered = Object.keys(PACE_ARITHMETIC_MODEL_OUTPUTS);

    // Assert
    expect(new Set(covered)).toEqual(new Set(ids));
  });

  it.each(PACE_CASES.map((b) => [b.id, b] as const))(
    "should compute every expected number of %s from the coach's literals",
    async (_, benchmark) => {
      // Arrange
      const output = PACE_ARITHMETIC_MODEL_OUTPUTS[benchmark.id];

      // Act
      const workout = await generate(benchmark, output);

      // Assert
      const result = evaluateBenchmark(benchmark, workout, 0);
      expect(result.errors).toEqual([]);
      const numbers = result.outcomes.find((o) => o.dimension === "numbers");
      expect(numbers?.status).toBe("passed");
    }
  );

  it("should refuse a pace the model computed in m/s", async () => {
    // Arrange
    const benchmark = byId("pace-es-total");
    const computed = {
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 4500 },
          targetType: "pace",
          target: { type: "pace", value: { unit: "mps", value: 3.2 } },
          intensity: "active",
        },
      ],
    };

    // Act
    const run = generate(benchmark, computed);

    // Assert
    await expect(run).rejects.toBeInstanceOf(AiParsingError);
  });

  it("should fail the numbers dimension on a pace a model rounded itself", () => {
    // Arrange
    const benchmark = byId("pace-es-total");
    const roundedByAModel = {
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 4500 },
          targetType: "pace",
          target: { type: "pace", value: { unit: "mps", value: 3.23 } },
          intensity: "active",
        },
      ],
    } as Workout;

    // Act
    const result = evaluateBenchmark(benchmark, roundedByAModel, 0);

    // Assert
    const numbers = result.outcomes.find((o) => o.dimension === "numbers");
    expect(numbers?.status).toBe("failed");
    expect(result.pass).toBe(false);
  });

  it("should fail the structure dimension on a fill counted past the total", async () => {
    // Arrange
    const benchmark = byId("pace-es-fill");
    const output = structuredClone(
      PACE_ARITHMETIC_MODEL_OUTPUTS["pace-es-fill"]
    ) as { steps: Array<Record<string, unknown>> };
    output.steps[1] = { ...output.steps[1], fill: undefined, repeatCount: 11 };

    // Act
    const workout = await generate(benchmark, output);

    // Assert
    const result = evaluateBenchmark(benchmark, workout, 0);
    const structure = result.outcomes.find((o) => o.dimension === "structure");
    expect(structure?.status).toBe("failed");
  });
});

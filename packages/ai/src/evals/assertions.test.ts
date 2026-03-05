import { describe, it, expect } from "vitest";
import { evaluateBenchmark } from "./assertions";
import type { Benchmark } from "./types";
import type { Workout } from "@kaiord/core";

const createWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  name: "Test Workout",
  sport: "cycling",
  steps: [
    {
      stepIndex: 0,
      name: "Warmup",
      intensity: "warmup",
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "open",
      target: { type: "open" },
    },
    {
      stepIndex: 1,
      name: "Main",
      intensity: "active",
      durationType: "time",
      duration: { type: "time", seconds: 1200 },
      targetType: "power",
      target: { type: "power", value: { unit: "range", min: 200, max: 250 } },
    },
    {
      stepIndex: 2,
      name: "Cooldown",
      intensity: "cooldown",
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "open",
      target: { type: "open" },
    },
  ],
  ...overrides,
});

const baseBenchmark: Benchmark = {
  id: "cycling-en-001",
  text: "30 min endurance ride",
  expectedSport: "cycling",
  minSteps: 1,
  maxSteps: 10,
  category: "cycling",
  language: "en",
};

describe("evaluateBenchmark", () => {
  it("should pass when workout meets all criteria", () => {
    const workout = createWorkout();

    const result = evaluateBenchmark(baseBenchmark, workout, 1500);

    expect(result.pass).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.id).toBe("cycling-en-001");
    expect(result.durationMs).toBe(1500);
    expect(result.sport).toBe("cycling");
    expect(result.stepCount).toBe(3);
  });

  it("should fail when sport does not match expected", () => {
    const workout = createWorkout({ sport: "running" });

    const result = evaluateBenchmark(baseBenchmark, workout, 1000);

    expect(result.pass).toBe(false);
    expect(result.errors).toContain(
      "Sport mismatch: expected cycling, got running"
    );
  });

  it("should fail when step count is below minimum", () => {
    const benchmark: Benchmark = { ...baseBenchmark, minSteps: 5 };
    const workout = createWorkout();

    const result = evaluateBenchmark(benchmark, workout, 1000);

    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.includes("Too few steps"))).toBe(true);
  });

  it("should fail when step count exceeds maximum", () => {
    const benchmark: Benchmark = { ...baseBenchmark, maxSteps: 2 };
    const workout = createWorkout();

    const result = evaluateBenchmark(benchmark, workout, 1000);

    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.includes("Too many steps"))).toBe(true);
  });

  it("should count repeat block steps correctly", () => {
    const workout = createWorkout({
      steps: [
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 0,
              name: "On",
              intensity: "active",
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 1,
              name: "Off",
              intensity: "rest",
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      ],
    });

    const result = evaluateBenchmark(
      { ...baseBenchmark, minSteps: 3, maxSteps: 3 },
      workout,
      1000
    );

    // 1 repeat block + 2 inner steps = 3
    expect(result.stepCount).toBe(3);
    expect(result.pass).toBe(true);
  });

  it("should fail with schema validation error for invalid workout", () => {
    const invalidWorkout = { name: "Bad" } as unknown as Workout;

    const result = evaluateBenchmark(baseBenchmark, invalidWorkout, 500);

    expect(result.pass).toBe(false);
    expect(result.errors[0]).toContain("Schema validation failed");
  });

  it("should pass when no expectedSport is set", () => {
    const benchmark: Benchmark = {
      ...baseBenchmark,
      expectedSport: undefined,
    };
    const workout = createWorkout({ sport: "running" });

    const result = evaluateBenchmark(benchmark, workout, 1000);

    expect(result.errors.every((e) => !e.includes("Sport mismatch"))).toBe(
      true
    );
  });

  describe("zone checks", () => {
    it("should fail when target min is below expected minValue with 5% tolerance", () => {
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "power",
          minValue: 220,
        },
      };
      const workout = createWorkout();

      const result = evaluateBenchmark(benchmark, workout, 1000);

      // The step has target.value = { unit: "range", min: 200, max: 250 }
      // checkZones accesses target as Record<string, unknown>
      // target.value = { unit: "range", min: 200, max: 250 }
      // min = value.min = 200, minValue * 0.95 = 209, 200 < 209 -> error
      expect(result.pass).toBe(false);
      expect(result.errors.some((e) => e.includes("Zone low"))).toBe(true);
    });

    it("should fail when target max exceeds expected maxValue with 5% tolerance", () => {
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "power",
          maxValue: 230,
        },
      };
      const workout = createWorkout();

      const result = evaluateBenchmark(benchmark, workout, 1000);

      // max = value.max = 250, maxValue * 1.05 = 241.5, 250 > 241.5 -> error
      expect(result.pass).toBe(false);
      expect(result.errors.some((e) => e.includes("Zone high"))).toBe(true);
    });

    it("should pass when target values are within tolerance", () => {
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "power",
          minValue: 200,
          maxValue: 260,
        },
      };
      const workout = createWorkout();

      const result = evaluateBenchmark(benchmark, workout, 1000);

      expect(result.errors.filter((e) => e.includes("Zone"))).toHaveLength(0);
    });

    it("should skip zone check when no active steps match targetType", () => {
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "heart_rate",
          minValue: 120,
        },
      };
      const workout = createWorkout();

      const result = evaluateBenchmark(benchmark, workout, 1000);

      expect(result.errors.filter((e) => e.includes("Zone"))).toHaveLength(0);
    });
  });
});

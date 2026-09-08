import { describe, it, expect } from "vitest";
import { evaluateBenchmark } from "./assertions";
import type { Benchmark, EvalResult } from "./types";
import type { Workout } from "@kaiord/core";
import {
  EVAL_DURATION_MS_DEFAULT,
  EVAL_DURATION_MS_PASS,
  EXPECTED_STEP_COUNT_THREE,
} from "../test-utils/constants";
import { expectMeasured } from "../test-utils/expect-measured";

const failedDimensions = (result: EvalResult): Array<string> =>
  result.outcomes.flatMap((o) => (o.status === "failed" ? [o.dimension] : []));

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
    // Arrange
    const workout = createWorkout();

    // Act
    const result = evaluateBenchmark(
      baseBenchmark,
      workout,
      EVAL_DURATION_MS_PASS
    );

    // Assert
    expect(result.pass).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.id).toBe("cycling-en-001");
    expect(result.durationMs).toBe(EVAL_DURATION_MS_PASS);
    expect(result.sport).toBe("cycling");
    expect(result.stepCount).toBe(EXPECTED_STEP_COUNT_THREE);
  });

  it("should fail when sport does not match expected", () => {
    // Arrange
    const workout = createWorkout({ sport: "running" });

    // Act
    const result = evaluateBenchmark(
      baseBenchmark,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(result.pass).toBe(false);
    expect(result.errors).toContain(
      "Sport mismatch: expected cycling, got running"
    );
  });

  it.each([
    {
      label: "is below the minimum",
      override: { minSteps: 5 },
      needle: "Too few steps",
    },
    {
      label: "exceeds the maximum",
      override: { maxSteps: 2 },
      needle: "Too many steps",
    },
  ])("should fail when step count $label", ({ override, needle }) => {
    // Arrange
    const benchmark: Benchmark = { ...baseBenchmark, ...override };
    const workout = createWorkout();

    // Act
    const result = evaluateBenchmark(
      benchmark,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.includes(needle))).toBe(true);
  });

  it("should count repeat block steps correctly", () => {
    // Arrange
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

    // Act
    const result = evaluateBenchmark(
      { ...baseBenchmark, minSteps: 3, maxSteps: 3 },
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(result.stepCount).toBe(EXPECTED_STEP_COUNT_THREE);
    expect(result.pass).toBe(true);
  });

  it("should fail with schema validation error for invalid workout", () => {
    // Arrange
    const invalidWorkout = { name: "Bad" } as unknown as Workout;

    // Act
    const result = evaluateBenchmark(baseBenchmark, invalidWorkout, 500);

    // Assert
    expect(result.pass).toBe(false);
    expect(result.errors[0]).toContain("Schema validation failed");
  });

  it("should pass when no expectedSport is set", () => {
    // Arrange
    const benchmark: Benchmark = {
      ...baseBenchmark,
      expectedSport: undefined,
    };
    const workout = createWorkout({ sport: "running" });

    // Act
    const result = evaluateBenchmark(
      benchmark,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(result.errors.every((e) => !e.includes("Sport mismatch"))).toBe(
      true
    );
  });

  describe("failure attribution", () => {
    it("should attribute a sport mismatch to the sport dimension", () => {
      // Arrange
      const workout = createWorkout({ sport: "running" });

      // Act
      const result = evaluateBenchmark(
        baseBenchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(failedDimensions(result)).toEqual(["sport"]);
    });

    it("should attribute a schema failure to the schema dimension", () => {
      // Arrange
      const invalid = { name: "Bad" } as unknown as Workout;

      // Act
      const result = evaluateBenchmark(
        baseBenchmark,
        invalid,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(failedDimensions(result)).toEqual(["schema"]);
    });

    it("should distinguish a step-count miss from a zone miss", () => {
      // Arrange
      const benchmark: Benchmark = {
        ...baseBenchmark,
        minSteps: 9,
        zoneCheck: { targetType: "power", minValue: 220 },
      };
      const workout = createWorkout();

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(new Set(failedDimensions(result))).toEqual(
        new Set(["steps", "zone"])
      );
    });

    it("should keep errors and failed outcomes describing the same set", () => {
      // Arrange
      const benchmark: Benchmark = { ...baseBenchmark, maxSteps: 1 };
      const workout = createWorkout({ sport: "running" });

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(result.errors).toEqual(
        result.outcomes.flatMap((o) =>
          o.status === "failed" ? [o.message] : []
        )
      );
    });
  });

  describe("zone checks", () => {
    it("should fail when target min is below expected minValue with 5% tolerance", () => {
      // Arrange
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "power",
          minValue: 220,
        },
      };
      const workout = createWorkout();

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(result.pass).toBe(false);
      expect(result.errors.some((e) => e.includes("Zone low"))).toBe(true);
    });

    it("should fail when target max exceeds expected maxValue with 5% tolerance", () => {
      // Arrange
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "power",
          maxValue: 230,
        },
      };
      const workout = createWorkout();

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(result.pass).toBe(false);
      expect(result.errors.some((e) => e.includes("Zone high"))).toBe(true);
    });

    it("should pass when target values are within tolerance", () => {
      // Arrange
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "power",
          minValue: 200,
          maxValue: 260,
        },
      };
      const workout = createWorkout();

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(result.errors.filter((e) => e.includes("Zone"))).toHaveLength(0);
    });

    it("should fail the zone check when no active steps match targetType", () => {
      // Arrange
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: {
          targetType: "heart_rate",
          minValue: 120,
        },
      };
      const workout = createWorkout();

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(result.pass).toBe(false);
      expect(result.errors).toContain(
        "No active heart_rate step to zone-check"
      );
    });

    it("should honour a declared bound of zero rather than skipping it", () => {
      // Arrange
      const benchmark: Benchmark = {
        ...baseBenchmark,
        zoneCheck: { targetType: "power", maxValue: 0 },
      };
      const workout = createWorkout();

      // Act
      const result = evaluateBenchmark(
        benchmark,
        workout,
        EVAL_DURATION_MS_DEFAULT
      );

      // Assert
      expect(result.errors.some((e) => e.startsWith("Zone high"))).toBe(true);
    });
  });
});

describe("evaluateBenchmark — absence of measurement", () => {
  const baseline: Benchmark = {
    id: "cycling-en-noexp",
    text: "ride",
    minSteps: 1,
    maxSteps: 10,
    category: "simple",
    language: "en",
  };

  it("should mark sport unmeasured when the benchmark declares no expectedSport", () => {
    // Arrange
    const workout = createWorkout({ sport: "running" });

    // Act
    const result = evaluateBenchmark(
      baseline,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    const sport = result.outcomes.find((o) => o.dimension === "sport");
    expect(sport?.status).toBe("unmeasured");
    expect(result.pass).toBe(true);
  });

  it("should mark zone unmeasured when the benchmark declares no zoneCheck", () => {
    // Arrange
    const workout = createWorkout();

    // Act
    const result = evaluateBenchmark(
      baseline,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    const zone = result.outcomes.find((o) => o.dimension === "zone");
    expect(zone?.status).toBe("unmeasured");
  });

  it("should give every unmeasured outcome a stated reason", () => {
    // Arrange
    const workout = createWorkout();

    // Act
    const result = evaluateBenchmark(
      baseline,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    const unmeasured = result.outcomes.filter((o) => o.status === "unmeasured");
    expect(unmeasured.length).toBeGreaterThan(0);
    for (const o of unmeasured) {
      expect(o.status === "unmeasured" && o.reason.length).toBeGreaterThan(0);
    }
  });

  it("should declare downstream dimensions unmeasured when schema fails", () => {
    // Arrange
    const invalid = { name: "Bad" } as unknown as Workout;

    // Act
    const result = evaluateBenchmark(
      baseline,
      invalid,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    const unmeasured = result.outcomes
      .filter((o) => o.status === "unmeasured")
      .map((o) => o.dimension);
    expect(new Set(unmeasured)).toEqual(new Set(["sport", "steps", "zone"]));
  });

  it("should not count an unmeasured dimension as a failure", () => {
    // Arrange
    const workout = createWorkout();

    // Act
    const result = evaluateBenchmark(
      baseline,
      workout,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(result.pass).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("expectMeasured", () => {
  const baseline: Benchmark = {
    id: "cycling-en-noexp",
    text: "ride",
    minSteps: 1,
    maxSteps: 10,
    category: "simple",
    language: "en",
  };

  it("should throw rather than let a test read a verdict off an unmeasured dimension", () => {
    // Arrange
    const result = evaluateBenchmark(
      baseline,
      createWorkout(),
      EVAL_DURATION_MS_DEFAULT
    );

    // Act
    const act = (): unknown => expectMeasured(result.outcomes, "sport");

    // Assert
    expect(act).toThrow(/was not measured/);
  });

  it("should return the outcome for a dimension that was measured", () => {
    // Arrange
    const result = evaluateBenchmark(
      baseline,
      createWorkout(),
      EVAL_DURATION_MS_DEFAULT
    );

    // Act
    const steps = expectMeasured(result.outcomes, "steps");

    // Assert
    expect(steps.status).toBe("passed");
  });

  it("should throw when the dimension has no outcome at all", () => {
    // Arrange
    const outcomes = [] as EvalResult["outcomes"];

    // Act
    const act = (): unknown => expectMeasured(outcomes, "zone");

    // Assert
    expect(act).toThrow(/No outcome for dimension/);
  });
});

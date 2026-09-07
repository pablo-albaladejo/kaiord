import { workoutSchema } from "@kaiord/core";
import {
  anyFailed,
  errorsOf,
  failed,
  passed,
  unmeasured,
} from "./dimension-outcomes";
import type { Benchmark, DimensionOutcome, EvalResult } from "./types";
import type { Workout } from "@kaiord/core";

// Eval allows ±5% drift on zone bounds to absorb AI rounding.
const ZONE_TOLERANCE = 0.05;

const DOWNSTREAM: ReadonlyArray<"sport" | "steps" | "zone"> = [
  "sport",
  "steps",
  "zone",
];

export const evaluateBenchmark = (
  benchmark: Benchmark,
  workout: Workout,
  durationMs: number
): EvalResult => {
  const schemaResult = workoutSchema.safeParse(workout);
  if (!schemaResult.success) {
    const message = `Schema validation failed: ${schemaResult.error.message}`;
    // The short-circuit is stated, not silent: the other dimensions did not
    // pass, they were never read, and a reader of the report can now tell.
    const outcomes = [
      failed("schema", message),
      ...DOWNSTREAM.map((d) =>
        unmeasured(
          d,
          "schema validation failed, so nothing downstream was read"
        )
      ),
    ];
    return {
      id: benchmark.id,
      pass: false,
      errors: errorsOf(outcomes),
      outcomes,
      durationMs,
    };
  }

  const stepCount = countSteps(workout);
  const outcomes: Array<DimensionOutcome> = [
    passed("schema"),
    sportOutcome(benchmark, workout),
    ...stepOutcomes(benchmark, stepCount),
    ...zoneOutcomes(benchmark, workout),
  ];

  return {
    id: benchmark.id,
    pass: !anyFailed(outcomes),
    errors: errorsOf(outcomes),
    outcomes,
    sport: workout.sport,
    stepCount,
    durationMs,
  };
};

const sportOutcome = (
  benchmark: Benchmark,
  workout: Workout
): DimensionOutcome => {
  if (!benchmark.expectedSport) {
    return unmeasured("sport", "benchmark declares no expectedSport");
  }
  return workout.sport === benchmark.expectedSport
    ? passed("sport")
    : failed(
        "sport",
        `Sport mismatch: expected ${benchmark.expectedSport}, got ${workout.sport}`
      );
};

const stepOutcomes = (
  benchmark: Benchmark,
  stepCount: number
): Array<DimensionOutcome> => {
  if (stepCount < benchmark.minSteps) {
    return [
      failed("steps", `Too few steps: ${stepCount} < ${benchmark.minSteps}`),
    ];
  }
  if (stepCount > benchmark.maxSteps) {
    return [
      failed("steps", `Too many steps: ${stepCount} > ${benchmark.maxSteps}`),
    ];
  }
  return [passed("steps")];
};

const zoneOutcomes = (
  benchmark: Benchmark,
  workout: Workout
): Array<DimensionOutcome> => {
  if (!benchmark.zoneCheck) {
    return [unmeasured("zone", "benchmark declares no zoneCheck")];
  }
  const errors = checkZones(workout, benchmark);
  return errors.length === 0
    ? [passed("zone")]
    : errors.map((message) => failed("zone", message));
};

const countSteps = (workout: Workout): number =>
  workout.steps.reduce((count, step) => {
    if ("repeatCount" in step) return count + step.steps.length + 1;
    return count + 1;
  }, 0);

const checkZones = (workout: Workout, benchmark: Benchmark): Array<string> => {
  const errors: Array<string> = [];
  const zc = benchmark.zoneCheck!;

  const steps = workout.steps.flatMap((s) =>
    "repeatCount" in s ? s.steps : [s]
  );

  const targetSteps = steps.filter(
    (s) => s.targetType === zc.targetType && s.intensity === "active"
  );

  // A zone check with nothing to check is a failure, not a pass: the model was
  // asked for active steps of this target type and produced none, and reporting
  // that as success is the green-that-means-nothing this suite exists to catch.
  if (targetSteps.length === 0) {
    errors.push(`No active ${zc.targetType} step to zone-check`);
    return errors;
  }

  for (const step of targetSteps) {
    const target = step.target as Record<string, unknown> | undefined;
    if (!target?.value) continue;

    const value = target.value as Record<string, unknown>;
    const min = (value.min ?? value.value) as number | undefined;
    const max = (value.max ?? value.value) as number | undefined;

    // Presence, not truthiness: a declared bound of 0 is a bound.
    if (
      zc.minValue !== undefined &&
      min !== undefined &&
      min < zc.minValue * (1 - ZONE_TOLERANCE)
    ) {
      errors.push(`Zone low ${min} below expected ${zc.minValue}`);
    }
    if (
      zc.maxValue !== undefined &&
      max !== undefined &&
      max > zc.maxValue * (1 + ZONE_TOLERANCE)
    ) {
      errors.push(`Zone high ${max} above expected ${zc.maxValue}`);
    }
  }

  return errors;
};

import { workoutSchema } from "@kaiord/core";
import type { Benchmark, EvalResult } from "./types";
import type { Workout } from "@kaiord/core";

export const evaluateBenchmark = (
  benchmark: Benchmark,
  workout: Workout,
  durationMs: number
): EvalResult => {
  const errors: Array<string> = [];

  const schemaResult = workoutSchema.safeParse(workout);
  if (!schemaResult.success) {
    return {
      id: benchmark.id,
      pass: false,
      errors: [`Schema validation failed: ${schemaResult.error.message}`],
      durationMs,
    };
  }

  if (benchmark.expectedSport && workout.sport !== benchmark.expectedSport) {
    errors.push(
      `Sport mismatch: expected ${benchmark.expectedSport}, got ${workout.sport}`
    );
  }

  const stepCount = countSteps(workout);
  if (stepCount < benchmark.minSteps) {
    errors.push(`Too few steps: ${stepCount} < ${benchmark.minSteps}`);
  }
  if (stepCount > benchmark.maxSteps) {
    errors.push(`Too many steps: ${stepCount} > ${benchmark.maxSteps}`);
  }

  if (benchmark.zoneCheck) {
    const zoneErrors = checkZones(workout, benchmark);
    errors.push(...zoneErrors);
  }

  return {
    id: benchmark.id,
    pass: errors.length === 0,
    errors,
    sport: workout.sport,
    stepCount,
    durationMs,
  };
};

const countSteps = (workout: Workout): number =>
  workout.steps.reduce((count, step) => {
    if ("repeatCount" in step) return count + step.steps.length + 1;
    return count + 1;
  }, 0);

const checkZones = (workout: Workout, benchmark: Benchmark): Array<string> => {
  const errors: Array<string> = [];
  const zc = benchmark.zoneCheck;
  if (!zc) return errors;

  const steps = workout.steps.flatMap((s) =>
    "repeatCount" in s ? s.steps : [s]
  );

  const targetSteps = steps.filter(
    (s) => s.targetType === zc.targetType && s.intensity === "active"
  );

  if (targetSteps.length === 0) return errors;

  for (const step of targetSteps) {
    const target = step.target as Record<string, unknown> | undefined;
    if (!target?.value) continue;

    const value = target.value as Record<string, unknown>;
    const min = (value.min ?? value.value) as number | undefined;
    const max = (value.max ?? value.value) as number | undefined;

    if (zc.minValue && min !== undefined && min < zc.minValue * 0.95) {
      errors.push(`Zone low ${min} below expected ${zc.minValue}`);
    }
    if (zc.maxValue && max !== undefined && max > zc.maxValue * 1.05) {
      errors.push(`Zone high ${max} above expected ${zc.maxValue}`);
    }
  }

  return errors;
};

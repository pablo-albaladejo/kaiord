import type { Workout } from "@kaiord/core";
import { failed, passed, unmeasured } from "./dimension-outcomes";
import type { Benchmark, DimensionOutcome, NumberCheck } from "./types";

type Step = Exclude<Workout["steps"][number], { repeatCount: number }>;

// Code rounds to 0.001; anything wider would let a model's own arithmetic in.
const EPSILON = 1e-9;

const same = (a: unknown, b: number) =>
  typeof a === "number" && Math.abs(a - b) < EPSILON;

const fields = (step: Step) => {
  const duration = step.duration as { seconds?: number; meters?: number };
  const value = (step.target as { value?: Record<string, unknown> }).value;
  const unit = value?.unit;
  return {
    seconds: duration.seconds,
    meters: duration.meters,
    paceMps:
      step.targetType === "pace" && unit === "mps" ? value?.value : undefined,
    paceMin:
      step.targetType === "pace" && unit === "range" ? value?.min : undefined,
    paceMax:
      step.targetType === "pace" && unit === "range" ? value?.max : undefined,
    percentMax: unit === "percent_max" ? value?.value : undefined,
  };
};

const matches = (step: Step, check: NumberCheck): boolean => {
  if (check.intensity !== undefined && step.intensity !== check.intensity)
    return false;
  const f = fields(step);
  const wanted: Array<[unknown, number | undefined]> = [
    [f.seconds, check.seconds],
    [f.meters, check.meters],
    [f.paceMps, check.paceMps],
    [f.paceMin, check.paceRange?.min],
    [f.paceMax, check.paceRange?.max],
    [f.percentMax, check.percentMax],
  ];
  return wanted.every(([actual, expected]) =>
    expected === undefined ? true : same(actual, expected)
  );
};

const describeCheck = (check: NumberCheck): string =>
  Object.entries(check)
    .map(([k, v]) => `${k} ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(", ");

export const numbersOutcome = (
  benchmark: Benchmark,
  workout: Workout
): DimensionOutcome => {
  const checks = benchmark.expectedNumbers;
  if (!checks)
    return unmeasured("numbers", "benchmark declares no expectedNumbers");
  const steps = workout.steps.flatMap((s) =>
    "repeatCount" in s ? s.steps : [s]
  );
  const missing = checks.filter((c) => !steps.some((s) => matches(s, c)));
  return missing.length === 0
    ? passed("numbers")
    : failed(
        "numbers",
        `No step has ${missing.map(describeCheck).join("; nor ")}`
      );
};

import type { Workout } from "@kaiord/core";
import { failed, passed, unmeasured } from "./dimension-outcomes";
import type { Benchmark, DimensionOutcome } from "./types";

type Step = Exclude<Workout["steps"][number], { repeatCount: number }>;

const flatSteps = (workout: Workout): Array<Step> =>
  workout.steps.flatMap((s) => ("repeatCount" in s ? s.steps : [s]));

const unitOf = (step: Step): string | undefined => {
  const value = (step.target as { value?: { unit?: string } }).value;
  return value?.unit;
};

const describeStep = (step: Step, i: number): string =>
  `step ${i} (${step.intensity ?? "no intensity"})`;

export const targetOutcome = (
  benchmark: Benchmark,
  workout: Workout
): DimensionOutcome => {
  const check = benchmark.targetCheck;
  if (!check) return unmeasured("targets", "benchmark declares no targetCheck");
  const problems = flatSteps(workout).flatMap((step, i) => {
    if (step.targetType !== check.targetType) {
      return [`${describeStep(step, i)} has a ${step.targetType} target`];
    }
    if (check.requireRange && unitOf(step) !== "range") {
      return [`${describeStep(step, i)} is ${unitOf(step)}, not a range`];
    }
    return [];
  });
  return problems.length === 0
    ? passed("targets")
    : failed("targets", `Expected ${check.targetType}: ${problems.join("; ")}`);
};

export const structureOutcome = (
  benchmark: Benchmark,
  workout: Workout
): DimensionOutcome => {
  const expected = benchmark.expectedRepeatCounts;
  if (!expected) {
    return unmeasured(
      "structure",
      "benchmark declares no expectedRepeatCounts"
    );
  }
  const actual = workout.steps.flatMap((s) =>
    "repeatCount" in s ? [s.repeatCount] : []
  );
  return actual.join(",") === expected.join(",")
    ? passed("structure")
    : failed(
        "structure",
        `Repeat counts: expected [${expected.join(", ")}], got [${actual.join(", ")}]`
      );
};

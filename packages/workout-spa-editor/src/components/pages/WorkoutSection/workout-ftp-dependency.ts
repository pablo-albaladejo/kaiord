/**
 * Does any target in this workout derive from FTP?
 *
 * Only relative power does: a percent of FTP (single or a `percent_ftp`
 * range) or a power zone. Absolute watts,
 * heart rate, pace, cadence and open steps read the same with or without an
 * FTP, so a "no FTP set" warning over them would be noise.
 */
import type { Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd-guards";

const FTP_UNITS: ReadonlySet<string> = new Set(["percent_ftp", "zone"]);

const stepDependsOnFtp = (step: WorkoutStep): boolean => {
  if (step.target.type !== "power") return false;
  const { value } = step.target;
  if (value.unit === "range") return value.basis === "percent_ftp";
  return FTP_UNITS.has(value.unit);
};

export const workoutDependsOnFtp = (workout: Workout): boolean =>
  workout.steps.some((item) =>
    isRepetitionBlock(item)
      ? item.steps.some(stepDependsOnFtp)
      : stepDependsOnFtp(item)
  );

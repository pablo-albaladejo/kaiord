/**
 * Does any target in this workout derive from FTP?
 *
 * Only relative power does: a percent of FTP or a power zone. Absolute watts,
 * heart rate, pace, cadence and open steps read the same with or without an
 * FTP, so a "no FTP set" warning over them would be noise.
 */
import type { Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd-guards";

const FTP_UNITS: ReadonlySet<string> = new Set(["percent_ftp", "zone"]);

const stepDependsOnFtp = (step: WorkoutStep): boolean =>
  step.target.type === "power" && FTP_UNITS.has(step.target.value.unit);

export const workoutDependsOnFtp = (workout: Workout): boolean =>
  workout.steps.some((item) =>
    isRepetitionBlock(item)
      ? item.steps.some(stepDependsOnFtp)
      : stepDependsOnFtp(item)
  );

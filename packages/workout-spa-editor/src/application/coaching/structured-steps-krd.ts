/**
 * The Workout a coach's steps table describes, built without the AI.
 *
 * Each row becomes a timed step named by the coach's zone label (no zone
 * number is invented), with its power range in watts as the target. KRD
 * steps hold one target and Garmin's writer sends no secondary target, so
 * the heart-rate range is kept as the step's note. A row repeated N > 1
 * times becomes one repetition holding its work and recovery steps; rows
 * under a count of 1 are plain steps.
 *
 * Returns `undefined` when the KRD cannot hold the table (a value out of
 * range), so the caller falls back to the AI rather than send part of it.
 */
import {
  createWorkoutKRD,
  type RepetitionBlock,
  type WorkoutStep,
} from "@kaiord/core";

import type {
  CoachingStepGroup,
  CoachingStructuredStep,
} from "../../types/coaching-structured-steps";
import type { KRD } from "../../types/schemas";
import type { ResolvedSport } from "./coaching-krd-sport";

export type StructuredStepsKrdInput = {
  groups: CoachingStepGroup[];
  sport: ResolvedSport;
  name?: string;
  created: string;
};

/** A row's heart-rate range, as the step's note and in the AI's table. */
export const heartRateText = (row: CoachingStructuredStep): string =>
  `HR ${row.heartRateBpm.min}-${row.heartRateBpm.max} bpm`;

const toStep = (row: CoachingStructuredStep, stepIndex: number) => ({
  stepIndex,
  name: row.zone,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: row.durationSeconds },
  targetType: "power" as const,
  target: {
    type: "power" as const,
    value: { unit: "range" as const, ...row.powerWatts },
  },
  notes: heartRateText(row),
});

const toSteps = (groups: CoachingStepGroup[]) => {
  let index = 0;
  return groups.flatMap((group): Array<WorkoutStep | RepetitionBlock> => {
    const steps = group.steps.map((row) => toStep(row, index++));
    return group.repeat > 1 ? [{ repeatCount: group.repeat, steps }] : steps;
  });
};

export const buildStructuredStepsKrd = (
  input: StructuredStepsKrdInput
): KRD | undefined => {
  try {
    return createWorkoutKRD(
      {
        ...(input.name ? { name: input.name } : {}),
        sport: input.sport.sport,
        ...(input.sport.subSport ? { subSport: input.sport.subSport } : {}),
        steps: toSteps(input.groups),
      },
      { created: input.created }
    );
  } catch {
    return undefined;
  }
};

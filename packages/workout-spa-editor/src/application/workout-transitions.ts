/**
 * Workout State Transition Functions
 *
 * Pure functions that validate and apply state transitions.
 * Each returns a new WorkoutRecord (immutable).
 */

import type { AiMeta } from "../types/calendar-fragments";
import type { WorkoutRecord } from "../types/calendar-record";
import type { KRD } from "../types/schemas";

const now = (): string => new Date().toISOString();

export const transitionToStructured = (
  workout: WorkoutRecord,
  krd: KRD,
  aiMeta: AiMeta
): WorkoutRecord => {
  if (workout.state !== "raw") {
    throw new Error(`Cannot transition from ${workout.state} to structured`);
  }
  return {
    ...workout,
    state: "structured",
    krd,
    aiMeta,
    lastProcessingError: null,
    updatedAt: now(),
  };
};

export const transitionToReady = (workout: WorkoutRecord): WorkoutRecord => {
  if (workout.state !== "structured") {
    throw new Error(`Cannot transition from ${workout.state} to ready`);
  }
  return { ...workout, state: "ready", updatedAt: now() };
};

export const transitionToPushed = (
  workout: WorkoutRecord,
  garminPushId: string
): WorkoutRecord => {
  if (workout.state !== "ready" && workout.state !== "modified") {
    throw new Error(`Cannot transition from ${workout.state} to pushed`);
  }
  return {
    ...workout,
    state: "pushed",
    garminPushId,
    updatedAt: now(),
  };
};

export const transitionToModified = (
  workout: WorkoutRecord,
  krd: KRD
): WorkoutRecord => {
  if (workout.state !== "pushed") {
    throw new Error(`Cannot transition from ${workout.state} to modified`);
  }
  const timestamp = now();
  return {
    ...workout,
    state: "modified",
    krd,
    modifiedAt: timestamp,
    updatedAt: timestamp,
  };
};

export const transitionToSkipped = (workout: WorkoutRecord): WorkoutRecord => {
  if (workout.state !== "raw") {
    throw new Error(`Cannot transition from ${workout.state} to skipped`);
  }
  return { ...workout, state: "skipped", updatedAt: now() };
};

export const transitionToRaw = (workout: WorkoutRecord): WorkoutRecord => {
  if (workout.state !== "skipped") {
    throw new Error(`Cannot transition from ${workout.state} to raw`);
  }
  return { ...workout, state: "raw", updatedAt: now() };
};

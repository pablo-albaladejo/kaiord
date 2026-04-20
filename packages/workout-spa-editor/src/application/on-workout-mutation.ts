/**
 * Central chokepoint for every KRD-mutating user action.
 *
 * Advances `modifiedAt` + `updatedAt`, optionally swaps in a
 * replacement KRD, and optionally transitions state. Every mutator
 * (edit step, reorder, paste, delete, group, ungroup, lap edit,
 * metadata edit) SHALL route through here before persisting — per
 * spa-workout-state-machine spec: "modifiedAt SHALL be updated on
 * any user edit to the KRD, not only on PUSHED→MODIFIED transitions".
 *
 * Pure: never mutates `draft`.
 *
 * Batch idempotency: pass a shared `timestamp` when multiple mutators
 * run in the same synchronous batch so they agree on one value.
 *
 * Selection-only actions (focus, hover, highlight) MUST NOT call this
 * helper — they are not mutations.
 */

import type { WorkoutState } from "../types/calendar-enums";
import type { WorkoutRecord } from "../types/calendar-record";
import type { KRD } from "../types/schemas";

export type OnWorkoutMutationOptions = {
  nextState?: WorkoutState;
  krd?: KRD;
  timestamp?: string;
};

const currentTimestamp = (): string => new Date().toISOString();

export function onWorkoutMutation(
  draft: WorkoutRecord,
  options: OnWorkoutMutationOptions = {}
): WorkoutRecord {
  const timestamp = options.timestamp ?? currentTimestamp();
  return {
    ...draft,
    state: options.nextState ?? draft.state,
    krd: options.krd ?? draft.krd,
    modifiedAt: timestamp,
    updatedAt: timestamp,
  };
}

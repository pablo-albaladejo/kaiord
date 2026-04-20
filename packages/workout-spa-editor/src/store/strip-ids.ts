import type { KRD, RepetitionBlock, Workout, WorkoutStep } from "../types/krd";
import { isWorkoutStep } from "../types/krd";
import type { UIWorkout } from "../types/krd-ui";

const stripStep = (step: WorkoutStep & { id?: string }): WorkoutStep => {
  const { id: _id, ...rest } = step as WorkoutStep & { id?: string };
  void _id;
  return rest;
};

const stripBlock = (block: RepetitionBlock): RepetitionBlock => {
  const { id: _id, steps, ...rest } = block;
  void _id;
  return { ...rest, steps: steps.map(stripStep) };
};

/**
 * Strip every `id` field from the nested step / block list of a UIWorkout
 * so the result is a portable `KRD` safe to hand to a `@kaiord/core`
 * conversion port, Dexie write, or any other outbound boundary.
 *
 * This is the single chokepoint referenced by design decision 6: every
 * outbound path MUST invoke it.
 *
 * Note: the outer KRD shape already has `extensions.structured_workout`
 * typed as `unknown` so the Zod `krdSchema` passes unknown values through
 * unchanged. The runtime assertion in `strip-ids.test.ts` is the primary
 * enforcement.
 */
export const stripIds = (uiWorkout: UIWorkout): KRD => {
  const workout = uiWorkout.extensions?.structured_workout as
    | Workout
    | undefined;

  if (!workout) return uiWorkout;

  const strippedSteps = workout.steps.map((item) =>
    isWorkoutStep(item) ? stripStep(item) : stripBlock(item)
  );

  return {
    ...uiWorkout,
    extensions: {
      ...uiWorkout.extensions,
      structured_workout: { ...workout, steps: strippedSteps },
    },
  };
};

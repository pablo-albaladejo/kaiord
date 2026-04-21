import type { KRD, RepetitionBlock, Workout, WorkoutStep } from "../types/krd";
import { isWorkoutStep } from "../types/krd";
import type { UIWorkout } from "../types/krd-ui";
import type { IdProvider } from "./providers/id-provider";
import { defaultIdProvider } from "./providers/id-provider";
import type { ItemId } from "./providers/item-id";
import { asItemId } from "./providers/item-id";

const hydrateStep = (
  step: WorkoutStep & { id?: string },
  idProvider: IdProvider
): WorkoutStep & { id: ItemId } => ({
  ...step,
  id: step.id ? asItemId(step.id) : idProvider(),
});

const hydrateBlock = (
  block: RepetitionBlock,
  idProvider: IdProvider
): RepetitionBlock & { id: ItemId } => ({
  ...block,
  id: block.id ? asItemId(block.id) : idProvider(),
  steps: block.steps.map((s) => hydrateStep(s, idProvider)),
});

const regenerateStep = (
  step: WorkoutStep,
  idProvider: IdProvider
): WorkoutStep & { id: ItemId } => ({ ...step, id: idProvider() });

const regenerateBlock = (
  block: RepetitionBlock,
  idProvider: IdProvider
): RepetitionBlock & { id: ItemId } => ({
  ...block,
  id: idProvider(),
  steps: block.steps.map((s) => regenerateStep(s, idProvider)),
});

/**
 * Hydrate a portable KRD into an in-memory UIWorkout by ensuring every
 * step and block carries an `ItemId`.
 *
 * Default (`preserveExistingIds: false`) regenerates every id on load —
 * design decision 6: "Stable IDs are an in-memory/UI concern and are
 * regenerated on every load." This also closes the paste-path trust
 * boundary (design decision 1): a clipboard-supplied id cannot redirect
 * focus onto an existing item.
 *
 * `preserveExistingIds: true` is retained as an opt-in for migration
 * fixtures and deterministic tests.
 */
export const hydrateUIWorkout = (
  krd: KRD,
  options: { idProvider?: IdProvider; preserveExistingIds?: boolean } = {}
): UIWorkout => {
  const idProvider = options.idProvider ?? defaultIdProvider;
  const preserve = options.preserveExistingIds ?? false;
  const workout = krd.extensions?.structured_workout as Workout | undefined;

  if (!workout) return krd as UIWorkout;

  const hydrated = workout.steps.map((item) =>
    preserve
      ? isWorkoutStep(item)
        ? hydrateStep(item, idProvider)
        : hydrateBlock(item, idProvider)
      : isWorkoutStep(item)
        ? regenerateStep(item, idProvider)
        : regenerateBlock(item, idProvider)
  );

  return {
    ...krd,
    extensions: {
      ...krd.extensions,
      structured_workout: { ...workout, steps: hydrated },
    },
  } as UIWorkout;
};

export type { ItemId };

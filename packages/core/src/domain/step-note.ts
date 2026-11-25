import type { WorkoutStep } from "./schemas/workout";

/** The longest note a step holds (`workoutStepSchema.notes`). */
export const STEP_NOTE_MAX = 256;

/**
 * Where a step records that the AI wrote its note on its own, with no cue
 * from the coach behind it. It rides in the step's free-form `extensions`, so
 * it is stored and synced with the Workout, while format writers, which map
 * named fields only, never send it to a device.
 */
const ORIGIN_NAMESPACE = "kaiord";

type OriginExtension = { noteOrigin?: "ai" };

const originOf = (step: WorkoutStep): OriginExtension | undefined => {
  const ext = step.extensions?.[ORIGIN_NAMESPACE];
  return ext && typeof ext === "object" ? (ext as OriginExtension) : undefined;
};

/** True when the step's note was written by the AI on its own. */
export const isAiNote = (step: WorkoutStep): boolean =>
  originOf(step)?.noteOrigin === "ai";

/** Returns a copy of `step` whose note is marked as the AI's own. */
export const markAiNote = (step: WorkoutStep): WorkoutStep => ({
  ...step,
  extensions: {
    ...step.extensions,
    [ORIGIN_NAMESPACE]: { ...originOf(step), noteOrigin: "ai" },
  },
});

const without = <T extends Record<string, unknown>>(obj: T, key: string) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

/** Returns a copy of `step` with no note origin, e.g. once a person edits it. */
export const clearNoteOrigin = (step: WorkoutStep): WorkoutStep => {
  const origin = originOf(step);
  if (!origin || !("noteOrigin" in origin)) return step;
  const restOrigin = without(origin, "noteOrigin");
  const restExt = without(step.extensions ?? {}, ORIGIN_NAMESPACE);
  const extensions = Object.keys(restOrigin).length
    ? { ...restExt, [ORIGIN_NAMESPACE]: restOrigin }
    : restExt;
  const rest = without(step, "extensions") as WorkoutStep;
  return Object.keys(extensions).length ? { ...rest, extensions } : rest;
};

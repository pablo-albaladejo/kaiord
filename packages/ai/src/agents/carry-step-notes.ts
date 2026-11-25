import type { Workout, WorkoutStep } from "@kaiord/core";
import { isRepetitionBlock, markAiNote, STEP_NOTE_MAX } from "@kaiord/core";

type RawStep = Record<string, unknown>;

const isRecord = (v: unknown): v is RawStep =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const rawStepsOf = (raw: unknown): Array<unknown> =>
  isRecord(raw) && Array.isArray(raw.steps) ? raw.steps : [];

/**
 * Cuts each raw step's note to what a step holds, so a long cue is kept
 * rather than failing the domain parse.
 */
export const cutRawStepNotes = (raw: unknown): unknown => {
  if (!isRecord(raw)) return raw;
  const cut = (step: unknown): unknown => {
    if (!isRecord(step)) return step;
    if (Array.isArray(step.steps)) return { ...step, steps: step.steps.map(cut) };
    return typeof step.notes === "string"
      ? { ...step, notes: step.notes.slice(0, STEP_NOTE_MAX) }
      : step;
  };
  return { ...raw, steps: rawStepsOf(raw).map(cut) };
};

const isAiOrigin = (raw: unknown): boolean =>
  isRecord(raw) && raw.noteOrigin === "ai" && typeof raw.notes === "string";

const markStep = (step: WorkoutStep, raw: unknown): WorkoutStep =>
  step.notes && isAiOrigin(raw) ? markAiNote(step) : step;

/**
 * Carries the model's `noteOrigin` onto the parsed Workout: the domain schema
 * has no such field, so a note the AI wrote on its own is marked through the
 * step's origin extension, read positionally from the raw output.
 */
export const carryNoteOrigins = (workout: Workout, raw: unknown): Workout => {
  const rawSteps = rawStepsOf(raw);
  return {
    ...workout,
    steps: workout.steps.map((step, i) => {
      const rawStep = rawSteps[i];
      if (!isRepetitionBlock(step)) return markStep(step, rawStep);
      const inner = isRecord(rawStep) ? rawStepsOf(rawStep) : [];
      return { ...step, steps: step.steps.map((s, j) => markStep(s, inner[j])) };
    }),
  };
};

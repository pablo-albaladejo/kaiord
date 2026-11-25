/**
 * Step notes for a Workout read from a coach's steps table.
 *
 * The table already gives every step; a notes-only AI call adds the coach's
 * cue to each. Only a step's note (and whether the AI wrote it on its own)
 * is ever written here, so the call cannot change a duration, a target or a
 * repeat. Each note reads the cue first, then the step's HR range; when the
 * two run over what a step holds, the cue is cut, never the HR range.
 */
import type { StepNote, StepNotesInput } from "@kaiord/ai/agents";
import {
  isRepetitionBlock,
  markAiNote,
  type RepetitionBlock,
  STEP_NOTE_MAX,
  type WorkoutStep,
} from "@kaiord/core";

import type { KRD } from "../../types/schemas";
import { getStructuredWorkout } from "../../utils/structured-workout";

/** `null` when no AI is configured, so no call is made. */
export type GenerateStepNotesPort = (
  input: StepNotesInput & { abortSignal?: AbortSignal }
) => Promise<StepNote[] | null>;

const SEPARATOR = " · ";

type Step = WorkoutStep | RepetitionBlock;

const leavesOf = (steps: Step[]): WorkoutStep[] =>
  steps.flatMap((s) => (isRepetitionBlock(s) ? s.steps : [s]));

/** One line per step, in order: its duration and the coach's zone label. */
const stepLine = (step: WorkoutStep): string =>
  [
    step.duration.type === "time" ? `${step.duration.seconds} s` : undefined,
    step.name,
  ]
    .filter(Boolean)
    .join(" ");

/** The cue first, then the HR range, cutting the cue to fit a step. */
export const composeStepNote = (cue: string, hrRange?: string): string => {
  if (!hrRange) return cue.slice(0, STEP_NOTE_MAX);
  const room = STEP_NOTE_MAX - hrRange.length - SEPARATOR.length;
  const cut = cue.slice(0, Math.max(room, 0)).trim();
  return cut ? `${cut}${SEPARATOR}${hrRange}` : hrRange;
};

const withNotes = (steps: Step[], notes: StepNote[]): Step[] => {
  const byStep = new Map(notes.map((n) => [n.step, n]));
  let position = 0;
  const noted = (step: WorkoutStep): WorkoutStep => {
    const note = byStep.get(++position);
    if (!note) return step;
    const next = { ...step, notes: composeStepNote(note.text, step.notes) };
    return note.origin === "ai" ? markAiNote(next) : next;
  };
  return steps.map((s) =>
    isRepetitionBlock(s) ? { ...s, steps: s.steps.map(noted) } : noted(s)
  );
};

const replaceSteps = (krd: KRD, steps: Step[]): KRD => {
  const workout = getStructuredWorkout(krd);
  if (!workout) return krd;
  return {
    ...krd,
    extensions: {
      ...krd.extensions,
      structured_workout: { ...workout, steps },
    },
  };
};

export type NotedTable = { krd: KRD; stepNotesFailed?: true };

/**
 * Asks for the table Workout's step notes. A failed call (offline, a key the
 * Provider refuses, a bad answer) keeps the table Workout as it is and says
 * so; a cancelled one still cancels the build.
 */
export const addTableStepNotes = async (
  generateStepNotes: GenerateStepNotesPort,
  coachText: string,
  krd: KRD,
  abortSignal?: AbortSignal
): Promise<NotedTable> => {
  const steps = (getStructuredWorkout(krd)?.steps ?? []) as Step[];
  try {
    const notes = await generateStepNotes({
      coachText,
      steps: leavesOf(steps).map(stepLine),
      abortSignal,
    });
    return notes
      ? { krd: replaceSteps(krd, withNotes(steps, notes)) }
      : { krd };
  } catch (error) {
    if (abortSignal?.aborted) throw error;
    return { krd, stepNotesFailed: true };
  }
};

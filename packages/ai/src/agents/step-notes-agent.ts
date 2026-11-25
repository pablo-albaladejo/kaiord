import { STEP_NOTE_MAX } from "@kaiord/core";
import { z } from "zod";

import { neutralizeClosingTag } from "../prompts/user-prompt";
import { STEP_NOTES_SYSTEM } from "../prompts/step-notes-prompt";
import type { AgentDefinition } from "./definition-types";

/** A note for the step numbered `step` (1-based) in the input's steps. */
export type StepNote = { step: number; text: string; origin: "coach" | "ai" };

const stepNotesSchema = z.object({
  notes: z.array(
    z.object({
      step: z.number(),
      text: z.string(),
      origin: z.enum(["coach", "ai"]),
    })
  ),
});

/**
 * Only `step`, `text` and `origin` of each entry survive: a step out of
 * range, a second note for one step and a blank note are dropped, and a long
 * note is cut to what a step holds. Nothing else in the answer reaches the
 * caller, so the call can never change a step's structure.
 */
const keepNotes = (raw: unknown, stepCount: number): StepNote[] => {
  const seen = new Set<number>();
  return stepNotesSchema.parse(raw).notes.flatMap(({ step, text, origin }) => {
    const trimmed = text.trim().slice(0, STEP_NOTE_MAX);
    const inRange = Number.isInteger(step) && step >= 1 && step <= stepCount;
    if (!inRange || !trimmed || seen.has(step)) return [];
    seen.add(step);
    return [{ step, text: trimmed, origin }];
  });
};

/** The notes-only definition over a Workout of `stepCount` steps. */
export const createStepNotesAgent = (
  stepCount: number
): AgentDefinition<StepNote[]> => ({
  id: "step-notes",
  version: STEP_NOTES_SYSTEM.version,
  purpose: "workout_generation",
  systemPrompt: { id: STEP_NOTES_SYSTEM.id },
  mode: "generate",
  outputSchema: stepNotesSchema,
  validate: (raw) => keepNotes(raw, stepCount),
});

export type StepNotesInput = {
  coachText: string;
  /** One line per step, numbered from 1 in the order given. */
  steps: string[];
};

const fenced = (tag: string, text: string) =>
  `<${tag}>\n${neutralizeClosingTag(text, tag)}\n</${tag}>`;

/** The user message of a step-notes call. */
export const buildStepNotesText = (input: StepNotesInput): string =>
  [
    fenced("coach_description", input.coachText),
    fenced("steps", input.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")),
  ].join("\n\n");

import { definePrompt } from "./registry";
import stepNotesRaw from "./step-notes.md";

/**
 * The step-notes system prompt: writes one note per step of a Workout whose
 * steps are already built (a coach's steps table), from the coach's text. It
 * returns notes only, never the steps' structure.
 */
export const STEP_NOTES_SYSTEM = definePrompt({
  id: "step-notes/system",
  version: "1.0.0",
  template: stepNotesRaw,
  variables: [],
});

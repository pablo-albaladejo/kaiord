import { definePrompt } from "./registry";
import systemPromptRaw from "./parse-workout.md";

/**
 * The workout-parser system prompt: converts natural-language descriptions
 * into KRD workout JSON. `{{sport}}` is injected at resolve time.
 */
export const WORKOUT_PARSER_SYSTEM = definePrompt({
  id: "workout-parser/system",
  version: "1.0.0",
  template: systemPromptRaw,
  variables: ["sport"],
});

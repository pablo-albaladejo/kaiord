import { definePrompt } from "./registry";
import { PARSER_PROMPT_VERSION } from "./parser-prompt-version";
import systemPromptRaw from "./parse-workout.md";

/**
 * The workout-parser system prompt: converts natural-language descriptions
 * into KRD workout JSON. `{{sport}}` is injected at resolve time.
 */
export const WORKOUT_PARSER_SYSTEM = definePrompt({
  id: "workout-parser/system",
  version: PARSER_PROMPT_VERSION,
  template: systemPromptRaw,
  variables: ["sport"],
});

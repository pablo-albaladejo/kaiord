import type { Workout } from "@kaiord/core";
import { workoutSchema } from "@kaiord/core";
import { aiWorkoutSchema } from "../adapters/ai-workout-schema";
import { reindexSteps } from "../adapters/reindex-steps";
import { WORKOUT_PARSER_SYSTEM } from "../prompts/parse-workout-prompt";
import type { AgentDefinition } from "./definition-types";

/**
 * The shipped workout-parser definition. `sportLine` is the resolved
 * `{{sport}}` hint (empty when no sport was requested). Strict validation
 * parses against the domain schema and reindexes steps.
 */
export const createWorkoutParserAgent = (
  sportLine: string
): AgentDefinition<Workout> => ({
  id: "workout-parser",
  version: WORKOUT_PARSER_SYSTEM.version,
  purpose: "workout_generation",
  systemPrompt: { id: WORKOUT_PARSER_SYSTEM.id, vars: { sport: sportLine } },
  mode: "generate",
  outputSchema: aiWorkoutSchema,
  validate: (raw) => reindexSteps(workoutSchema.parse(raw)),
});

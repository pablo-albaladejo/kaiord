import type { Workout } from "@kaiord/core";
import { workoutSchema } from "@kaiord/core";
import { aiWorkoutSchema } from "../adapters/ai-workout-schema";
import { reindexSteps } from "../adapters/reindex-steps";
import { resolveZoneTargets } from "../adapters/resolve-zone-targets";
import { WORKOUT_PARSER_SYSTEM } from "../prompts/parse-workout-prompt";
import type { AthleteZoneTables } from "../types";
import type { AgentDefinition } from "./definition-types";

/**
 * The shipped workout-parser definition. `sportLine` is the resolved
 * `{{sport}}` hint (empty when no sport was requested). Validation first
 * resolves zone targets against the athlete's `zones`, then parses against
 * the domain schema and reindexes steps.
 */
export const createWorkoutParserAgent = (
  sportLine: string,
  zones?: AthleteZoneTables
): AgentDefinition<Workout> => ({
  id: "workout-parser",
  version: WORKOUT_PARSER_SYSTEM.version,
  purpose: "workout_generation",
  systemPrompt: { id: WORKOUT_PARSER_SYSTEM.id, vars: { sport: sportLine } },
  mode: "generate",
  outputSchema: aiWorkoutSchema,
  validate: (raw) =>
    reindexSteps(workoutSchema.parse(resolveZoneTargets(raw, zones))),
});

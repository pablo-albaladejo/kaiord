import type { Workout } from "@kaiord/core";
import { workoutSchema } from "@kaiord/core";
import { aiWorkoutSchema } from "../adapters/ai-workout-schema";
import { reindexSteps } from "../adapters/reindex-steps";
import { resolveZoneTargets } from "../adapters/resolve-zone-targets";
import { WORKOUT_PARSER_SYSTEM } from "../prompts/parse-workout-prompt";
import type { AthleteZoneTables } from "../types";
import { assertBasisOnPowerOnly } from "./assert-basis-on-power";
import type { AgentDefinition } from "./definition-types";

const MAX_NAME_LENGTH = 40;

// A blank name is no name: drop it so callers apply their own fallback. The
// prompt asks for at most MAX_NAME_LENGTH characters; enforce it here.
const normalizeName = (workout: Workout): Workout => {
  const { name, ...rest } = workout;
  const trimmed = name?.trim().slice(0, MAX_NAME_LENGTH).trim();
  return trimmed ? { ...rest, name: trimmed } : rest;
};

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
  validate: (raw) => {
    assertBasisOnPowerOnly(raw);
    return normalizeName(
      reindexSteps(workoutSchema.parse(resolveZoneTargets(raw, zones)))
    );
  },
  countItems: (partial) => {
    const steps = (partial as { steps?: unknown } | undefined)?.steps;
    return Array.isArray(steps) ? steps.length : undefined;
  },
});

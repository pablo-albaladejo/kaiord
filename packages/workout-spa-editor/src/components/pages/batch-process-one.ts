/**
 * Batch ProcessOne Factory
 *
 * Creates a processOne function for the batch processor that
 * calls the AI processor and persists results to Dexie.
 */

import { processWorkoutWithAi } from "../../application/ai-workout-processor";
import type {
  ProcessOneFn,
  ProcessOneOutcome,
} from "../../application/batch-processor";
import { updateWorkoutRecord } from "../../application/save-workout-edits";
import { transitionToStructured } from "../../application/workout-transitions";
import { generateWorkoutKrd } from "../../lib/generate-workout";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";

export function createProcessOne(
  provider: LlmProviderConfig,
  modelId: string,
  persistence: Pick<PersistencePort, "workouts" | "transaction">
): ProcessOneFn {
  return async (
    workout: WorkoutRecord,
    allowRetry: boolean
  ): Promise<ProcessOneOutcome> => {
    // Usage telemetry, the athlete's zones and their custom AI instructions
    // all come from `generateWorkoutKrd`'s app-db defaults.
    const generateFn = (prompt: string, sport: string) =>
      generateWorkoutKrd({
        text: prompt,
        provider,
        modelId,
        profileId: workout.profileId,
        sport: sport as Parameters<typeof generateWorkoutKrd>[0]["sport"],
      });

    const result = await processWorkoutWithAi({
      workout,
      selectedComments: (workout.raw?.comments ?? []).map((c) => c.text),
      generateFn,
      provider: provider.type,
      model: modelId,
      allowRetry,
    });

    if (!result.ok) return result;
    // Written onto the row as stored after the AI call, so a move made
    // meanwhile keeps its date; a row that left `raw` is left alone and
    // reported as not written.
    const written = await updateWorkoutRecord(
      persistence,
      workout.id,
      (fresh) =>
        fresh.state === "raw"
          ? transitionToStructured(fresh, result.krd, result.aiMeta)
          : undefined
    );
    return { ...result, written };
  };
}

/**
 * Batch ProcessOne Factory
 *
 * Creates a processOne function for the batch processor that
 * calls the AI processor and persists results to Dexie.
 */

import type { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import type { ProcessResult } from "../../application/ai-workout-processor";
import { processWorkoutWithAi } from "../../application/ai-workout-processor";
import type { ProcessOneFn } from "../../application/batch-processor";
import { transitionToStructured } from "../../application/workout-transitions";
import { generateWorkoutKrd } from "../../lib/generate-workout";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";

export function createProcessOne(
  provider: LlmProviderConfig,
  db: KaiordDatabase
): ProcessOneFn {
  return async (
    workout: WorkoutRecord,
    allowRetry: boolean
  ): Promise<ProcessResult> => {
    const generateFn = (prompt: string, sport: string) =>
      generateWorkoutKrd({
        text: prompt,
        provider,
        sport: sport as Parameters<typeof generateWorkoutKrd>[0]["sport"],
      });

    const result = await processWorkoutWithAi({
      workout,
      selectedComments: (workout.raw?.comments ?? []).map((c) => c.text),
      zonesContext: "",
      generateFn,
      provider: provider.type,
      model: provider.model,
      allowRetry,
    });

    if (result.ok) {
      const updated = transitionToStructured(
        workout,
        result.krd,
        result.aiMeta
      );
      await db.table("workouts").put(updated);
    }

    return result;
  };
}

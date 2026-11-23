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
import type { TraceRun } from "../../application/trace/trace-run";
import { transitionToStructured } from "../../application/workout-transitions";
import {
  generateWorkoutKrd,
  type GenerationDeps,
} from "../../lib/generate-workout";
import { askGenerationHealth, askOnce } from "../../lib/health-sharing-gate";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";

export type BatchRunDeps = {
  deps: GenerationDeps;
  trace?: TraceRun;
  /** Cancels the batch, and its heart-rate question while it waits. */
  signal?: AbortSignal;
};

export function createProcessOne(
  provider: LlmProviderConfig,
  modelId: string,
  persistence: Pick<PersistencePort, "workouts" | "transaction">,
  { deps, trace, signal }: BatchRunDeps
): ProcessOneFn {
  // One question for the whole batch, asked when heart-rate data would first go.
  const askHealth = askOnce(() =>
    askGenerationHealth(provider.type, {
      signal,
      onWait: () => void trace?.checkpoint(),
    })
  );
  return async (
    workout: WorkoutRecord,
    allowRetry: boolean
  ): Promise<ProcessOneOutcome> => {
    // Usage, the athlete's zones and their custom AI instructions come from
    // `generateWorkoutKrd`'s app-db defaults; every generation joins the
    // batch's one Trace.
    const generateFn = (prompt: string, sport: string) =>
      generateWorkoutKrd({
        deps,
        text: prompt,
        provider,
        modelId,
        profileId: workout.profileId,
        askHealth,
        trace,
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

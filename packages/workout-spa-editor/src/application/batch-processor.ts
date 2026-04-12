/**
 * Batch Processor
 *
 * Processes multiple workouts sequentially with continue-on-failure
 * semantics, 500ms cadence, and cancellation support.
 * Enforces a batch-level retry budget of 3.
 */

import type { WorkoutRecord } from "../types/calendar-record";
import type { ProcessResult } from "./ai-workout-processor";

export type BatchProgress = {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  current: string | null;
};

export type BatchResult = {
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
  cancelled: boolean;
};

export type ProcessOneFn = (
  workout: WorkoutRecord,
  allowRetry: boolean
) => Promise<ProcessResult>;

const CADENCE_MS = 500;
const MAX_BATCH_RETRIES = 3;

export async function processBatch(
  workouts: WorkoutRecord[],
  processOne: ProcessOneFn,
  onProgress: (progress: BatchProgress) => void,
  signal: AbortSignal
): Promise<BatchResult> {
  const result: BatchResult = {
    succeeded: [],
    failed: [],
    cancelled: false,
  };
  let retriesUsed = 0;

  for (let i = 0; i < workouts.length; i++) {
    if (signal.aborted) {
      result.cancelled = true;
      break;
    }

    const workout = workouts[i];
    onProgress(buildProgress(workouts.length, result, workout.id));

    const canRetry = retriesUsed < MAX_BATCH_RETRIES;
    const outcome = await processOne(workout, canRetry);

    if (outcome.retried) retriesUsed++;

    if (outcome.ok) {
      result.succeeded.push(workout.id);
    } else {
      result.failed.push({ id: workout.id, error: outcome.error });
    }

    onProgress(buildProgress(workouts.length, result, null));

    if (i < workouts.length - 1 && !signal.aborted) {
      await delay(CADENCE_MS);
    }
  }

  return result;
}

function buildProgress(
  total: number,
  r: BatchResult,
  current: string | null
): BatchProgress {
  return {
    total,
    processed: r.succeeded.length + r.failed.length,
    succeeded: r.succeeded.length,
    failed: r.failed.length,
    current,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

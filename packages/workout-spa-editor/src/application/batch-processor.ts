/**
 * Batch Processor
 *
 * Processes multiple workouts sequentially with continue-on-failure
 * semantics, 500ms cadence, and cancellation support.
 * Enforces a batch-level retry budget of 3.
 *
 * Emits per-workout status via `byId` + summary `counts` so the
 * calendar progress panel can render the spec-required
 * "per-workout status (success/fail/queued)" detail.
 */

import type { WorkoutRecord } from "../types/calendar-record";
import type { ProcessResult } from "./ai-workout-processor";
import type { WorkoutBatchStatus } from "./batch-progress";
import { type BatchProgress, buildBatchProgress } from "./batch-progress";

export type {
  BatchProgress,
  BatchProgressCounts,
  WorkoutBatchStatus,
} from "./batch-progress";

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
  const result: BatchResult = { succeeded: [], failed: [], cancelled: false };
  const byId: Record<string, WorkoutBatchStatus> = Object.fromEntries(
    workouts.map((w) => [w.id, "queued"])
  );
  let retriesUsed = 0;

  for (let i = 0; i < workouts.length; i++) {
    if (signal.aborted) {
      result.cancelled = true;
      break;
    }

    const workout = workouts[i];
    byId[workout.id] = "processing";
    onProgress(buildBatchProgress(workouts.length, workout.id, byId));

    const canRetry = retriesUsed < MAX_BATCH_RETRIES;
    const outcome = await processOne(workout, canRetry);
    if (outcome.retried) retriesUsed++;

    if (outcome.ok) {
      result.succeeded.push(workout.id);
      byId[workout.id] = "succeeded";
    } else {
      result.failed.push({ id: workout.id, error: outcome.error });
      byId[workout.id] = "failed";
    }

    onProgress(buildBatchProgress(workouts.length, null, byId));

    if (i < workouts.length - 1 && !signal.aborted) await delay(CADENCE_MS);
  }

  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

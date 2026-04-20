/**
 * Batch progress shape emitted by `processBatch`.
 *
 * `counts` + `byId` are the spec-required fields (spa-calendar
 * "per-workout status (success/fail/queued)"). The legacy
 * `processed`/`succeeded`/`failed` mirrors are kept for back-compat
 * with existing consumers and will fold into `counts.*` once all
 * readers migrate.
 */

export type WorkoutBatchStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed";

export type BatchProgressCounts = {
  queued: number;
  processing: number;
  succeeded: number;
  failed: number;
};

export type BatchProgress = {
  total: number;
  counts: BatchProgressCounts;
  current: string | null;
  byId: Record<string, WorkoutBatchStatus>;
  /** Back-compat aggregate — `counts.succeeded + counts.failed`. */
  processed: number;
  /** Back-compat alias for `counts.succeeded`. */
  succeeded: number;
  /** Back-compat alias for `counts.failed`. */
  failed: number;
};

export function buildBatchProgress(
  total: number,
  current: string | null,
  byId: Record<string, WorkoutBatchStatus>
): BatchProgress {
  const counts: BatchProgressCounts = {
    queued: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
  };
  for (const status of Object.values(byId)) counts[status]++;

  return {
    total,
    counts,
    current,
    byId: { ...byId },
    processed: counts.succeeded + counts.failed,
    succeeded: counts.succeeded,
    failed: counts.failed,
  };
}

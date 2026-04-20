import { X } from "lucide-react";

import type { BatchProgress } from "../../../application/batch-processor";

function deriveCounts(progress: BatchProgress) {
  // Back-compat: `counts` is the spec-required shape but legacy emit
  // sites may still provide only the aggregate totals.
  return (
    progress.counts ?? {
      queued: Math.max(progress.total - progress.processed - 1, 0),
      processing: progress.current ? 1 : 0,
      succeeded: progress.succeeded,
      failed: progress.failed,
    }
  );
}

export function ProcessingStatus({
  progress,
  onCancel,
}: {
  progress: BatchProgress;
  onCancel: () => void;
}) {
  const counts = deriveCounts(progress);

  return (
    <>
      <div className="flex-1 text-sm">
        <div data-testid="batch-progress">
          Processing {progress.processed} of {progress.total}
        </div>
        <div
          data-testid="batch-progress-breakdown"
          className="mt-0.5 flex gap-3 text-xs text-gray-600 dark:text-gray-400"
        >
          <span data-testid="batch-count-queued">Queued {counts.queued}</span>
          <span data-testid="batch-count-processing">
            Processing {counts.processing}
          </span>
          <span data-testid="batch-count-succeeded">
            Succeeded {counts.succeeded}
          </span>
          <span data-testid="batch-count-failed">Failed {counts.failed}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel batch processing"
        className="rounded p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );
}

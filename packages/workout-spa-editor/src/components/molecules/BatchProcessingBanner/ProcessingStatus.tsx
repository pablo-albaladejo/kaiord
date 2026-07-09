import { X } from "lucide-react";

import type { BatchProgress } from "../../../application/batch-processor";
import { useTranslate } from "../../../i18n/use-translate";

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
  const t = useTranslate("coaching");

  return (
    <>
      <div className="flex-1 text-sm">
        <div data-testid="batch-progress">
          {t("batch.progress", {
            processed: progress.processed,
            total: progress.total,
          })}
        </div>
        <div
          data-testid="batch-progress-breakdown"
          className="mt-0.5 flex gap-3 text-xs text-gray-600 dark:text-gray-400"
        >
          <span data-testid="batch-count-queued">
            {t("batch.queued", { n: counts.queued })}
          </span>
          <span data-testid="batch-count-processing">
            {t("batch.processing", { n: counts.processing })}
          </span>
          <span data-testid="batch-count-succeeded">
            {t("batch.succeeded", { n: counts.succeeded })}
          </span>
          <span data-testid="batch-count-failed">
            {t("batch.failed", { n: counts.failed })}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label={t("batch.cancelAria")}
        className="rounded p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );
}

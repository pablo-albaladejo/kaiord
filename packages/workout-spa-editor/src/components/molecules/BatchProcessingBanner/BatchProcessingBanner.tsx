/**
 * BatchProcessingBanner - Shows raw workout count and batch action.
 *
 * During processing, shows progress with cancel button.
 */

import { Bot, X } from "lucide-react";

import type { BatchProgress } from "../../../application/batch-processor";

export type BatchProcessingBannerProps = {
  rawCount: number;
  isProcessing: boolean;
  progress: BatchProgress | null;
  onProcess: () => void;
  onCancel: () => void;
};

export function BatchProcessingBanner({
  rawCount,
  isProcessing,
  progress,
  onProcess,
  onCancel,
}: BatchProcessingBannerProps) {
  if (rawCount === 0 && !isProcessing) return null;

  return (
    <div
      data-testid="batch-processing-banner"
      className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950"
    >
      <Bot className="h-5 w-5 text-yellow-600" />
      {isProcessing && progress ? (
        <ProcessingStatus progress={progress} onCancel={onCancel} />
      ) : (
        <IdleStatus rawCount={rawCount} onProcess={onProcess} />
      )}
    </div>
  );
}

function IdleStatus({
  rawCount,
  onProcess,
}: {
  rawCount: number;
  onProcess: () => void;
}) {
  return (
    <>
      <span className="flex-1 text-sm">
        {rawCount} raw workout{rawCount !== 1 ? "s" : ""} this week
      </span>
      <button
        type="button"
        onClick={onProcess}
        className="rounded-md bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
      >
        Process all with AI
      </button>
    </>
  );
}

function ProcessingStatus({
  progress,
  onCancel,
}: {
  progress: BatchProgress;
  onCancel: () => void;
}) {
  return (
    <>
      <span className="flex-1 text-sm" data-testid="batch-progress">
        Processing {progress.processed} of {progress.total}
      </span>
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

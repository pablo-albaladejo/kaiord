/**
 * BatchProcessingBanner - Shows raw workout count and batch action.
 *
 * During processing, shows progress with cancel button + the
 * spec-required per-workout status breakdown
 * (queued / processing / succeeded / failed).
 */

import { Bot } from "lucide-react";

import type { BatchProgress } from "../../../application/batch-processor";
import { useTranslate } from "../../../i18n/use-translate";
import { ProcessingStatus } from "./ProcessingStatus";

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
  const t = useTranslate("coaching");
  return (
    <>
      <span className="flex-1 text-sm">
        {t(rawCount === 1 ? "batch.rawCount_one" : "batch.rawCount_other", {
          count: rawCount,
        })}
      </span>
      <button
        type="button"
        onClick={onProcess}
        className="rounded-md bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
      >
        {t("batch.processAll")}
      </button>
    </>
  );
}

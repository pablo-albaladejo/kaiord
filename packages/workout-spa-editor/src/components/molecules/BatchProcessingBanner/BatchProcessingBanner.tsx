/**
 * BatchProcessingBanner - Shows raw workout count and batch action.
 *
 * This is the calendar's one week-scoped action. The surface is neutral and
 * the marker is an icon: warning left the palette, and a state that needs the
 * user says so with a shape and a sentence, not with amber.
 *
 * During processing, shows progress with cancel button + the
 * spec-required per-workout status breakdown
 * (queued / processing / succeeded / failed).
 */

import { TriangleAlert } from "lucide-react";

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
      className="flex items-center gap-3 rounded-xl border border-edge bg-surface-elevated p-3.5"
    >
      <TriangleAlert
        aria-hidden="true"
        className="h-[18px] w-[18px] shrink-0 text-ink-strong"
      />
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
      <span className="flex-1 text-[13px] font-medium tabular-nums text-ink-strong">
        {t(rawCount === 1 ? "batch.rawCount_one" : "batch.rawCount_other", {
          count: rawCount,
        })}
      </span>
      <button
        type="button"
        onClick={onProcess}
        className="shrink-0 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface hover:opacity-90"
      >
        {t("batch.processAll")}
      </button>
    </>
  );
}

/**
 * Body-level overlay rendered while the synchronous AI flow is in
 * flight (per design D2). Replaces the action row with the run's real
 * progress and a Cancel button that aborts the in-flight request.
 *
 * Only the phase label sits in the polite live region, so a screen
 * reader hears each phase once; the step count, the last finished step
 * and the seconds counters change far more often and are left out of it.
 */
import { Loader2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { aiPhaseLabel } from "./ai-phase-label";
import type { AiRunProgress } from "./ai-run-progress";
import { AiProgressDetails } from "./AiProgressDetails";

export type AiProcessingOverlayProps = {
  progress: AiRunProgress;
  onCancel: () => void;
};

export function AiProcessingOverlay({
  progress,
  onCancel,
}: AiProcessingOverlayProps) {
  const t = useTranslate("coaching");
  return (
    <div
      data-testid="coaching-dialog-ai-processing"
      className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span
          role="status"
          aria-live="polite"
          data-testid="coaching-dialog-ai-phase"
        >
          {aiPhaseLabel(t, progress)}
        </span>
      </div>
      <AiProgressDetails progress={progress} />
      <button
        type="button"
        data-testid="coaching-dialog-ai-cancel"
        onClick={onCancel}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        {t("aiProgress.cancel")}
      </button>
    </div>
  );
}

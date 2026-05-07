/**
 * Body-level overlay rendered while the synchronous AI flow is in
 * flight (per design D2). Replaces the action row with a spinner and a
 * Cancel button that aborts the in-flight request.
 *
 * Keep visually consistent with `LinkedWorkoutSection`'s rounded card
 * but in slate so it doesn't conflict with the activity description
 * panel above.
 */
import { Loader2 } from "lucide-react";

export type AiProcessingOverlayProps = {
  onCancel: () => void;
};

export function AiProcessingOverlay({ onCancel }: AiProcessingOverlayProps) {
  return (
    <div
      data-testid="coaching-dialog-ai-processing"
      className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Processing with AI…</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        This usually takes 10-15 seconds.
      </p>
      <button
        type="button"
        data-testid="coaching-dialog-ai-cancel"
        onClick={onCancel}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
    </div>
  );
}

/**
 * Inline AI failure state (per design D3): shows the typed reason and
 * the four recovery actions: Retry AI, Edit manually, Match existing,
 * Close. No workout was persisted, so the activity remains in the
 * "no-workout" state — these actions are exactly the same starting
 * points as the no-workout layout, just with the error context.
 */
import type { AiFailureReason } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import { useTranslate } from "../../../i18n/use-translate";

export type AiErrorStateProps = {
  reason: AiFailureReason | "not-found" | "no-provider";
  detail?: string;
  onRetry: () => void;
  onEditManually: () => void;
  onMatchExisting: () => void;
  onClose: () => void;
};

export function AiErrorState(props: AiErrorStateProps) {
  const t = useTranslate("coaching");
  return (
    <div
      data-testid="coaching-dialog-ai-error"
      className="space-y-3 rounded border border-rose-200 bg-rose-50/60 p-3 text-sm dark:border-rose-800 dark:bg-rose-950/30"
    >
      <p className="text-rose-700 dark:text-rose-300">
        ⚠ {t("aiError.heading")}: {t(`aiError.${props.reason}`)}
        {props.detail ? ` (${props.detail})` : ""}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-md border border-edge px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t("actions.close")}
        </button>
        <button
          type="button"
          onClick={props.onMatchExisting}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {t("actions.matchExisting")}
        </button>
        <button
          type="button"
          onClick={props.onEditManually}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {t("actions.editManually")}
        </button>
        <button
          type="button"
          data-testid="coaching-dialog-ai-retry"
          onClick={props.onRetry}
          className="rounded-md bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
        >
          {t("actions.retryAi")}
        </button>
      </div>
    </div>
  );
}

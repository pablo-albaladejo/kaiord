/**
 * Matched-state contextual actions (per design D7).
 *
 * Buttons toggled by the matched workout's `state`:
 *   - raw       → [Process with AI] [Open editor]
 *   - structured→ [Open editor] [Push to Garmin] (disabled)
 *   - ready     → [Open editor] [Push to Garmin] (enabled)
 *   - pushed    → [Open editor]
 *   - any other → [Open editor]
 *
 * `[Process with AI]` for raw workouts re-uses the dialog's AI handler
 * (the use case detects the existing workout id and transitions raw →
 * structured in place rather than creating a new record).
 *
 * `[Push to Garmin]` is intentionally not wired here: clicking it
 * navigates to the editor (where the existing GarminPushButton owns
 * the push toasts). Direct push from the dialog is tracked as a
 * follow-up — the affordance lives here so users see the path.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";

export type MatchedActionsProps = {
  workout: WorkoutRecord;
  splitting: boolean;
  onClose: () => void;
  onOpenEditor: () => void;
  onAiProcess: () => void;
  onPushToGarmin: () => void;
  onSplit: () => void;
};

export function MatchedActions(props: MatchedActionsProps) {
  const state = props.workout.state;
  const showAi = state === "raw";
  const showPush = state === "structured" || state === "ready";
  const pushDisabled = state === "structured";
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-3">
      <button
        type="button"
        onClick={props.onClose}
        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Close
      </button>
      <button
        type="button"
        data-testid="coaching-dialog-split"
        disabled={props.splitting}
        onClick={props.onSplit}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        {props.splitting ? "Splitting…" : "Split"}
      </button>
      {showPush && (
        <button
          type="button"
          data-testid="coaching-dialog-push"
          disabled={pushDisabled}
          onClick={props.onPushToGarmin}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Push to Garmin
        </button>
      )}
      {showAi && (
        <button
          type="button"
          data-testid="coaching-dialog-ai-process"
          onClick={props.onAiProcess}
          className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700"
        >
          Process with AI
        </button>
      )}
      <button
        type="button"
        data-testid="coaching-dialog-open-editor"
        onClick={props.onOpenEditor}
        className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-800"
      >
        Open editor
      </button>
    </div>
  );
}

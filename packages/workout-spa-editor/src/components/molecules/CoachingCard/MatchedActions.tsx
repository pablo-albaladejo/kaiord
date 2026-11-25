/**
 * Matched-state contextual actions (per design D7).
 *
 * Buttons toggled by the matched workout's `state`:
 *   - raw       → [Process with AI] [Open editor]
 *   - structured→ [Regenerate] [Open editor] [Send to Garmin]
 *   - ready     → [Regenerate] [Open editor] [Send to Garmin]
 *   - pushed    → [Regenerate] [Open editor]
 *   - any other → [Regenerate] [Open editor] (skipped: [Open editor])
 *
 * [Split] and [Delete workout] join every state, and [Move to another day]
 * does inside the calendar's move flow, disabled with the reason once the
 * Coaching Activity is done (design §3.8).
 *
 * `[Process with AI]` for raw workouts re-uses the dialog's AI handler (the
 * use case transitions raw → structured in place). `[Regenerate]` is the
 * explicit rebuild of a Workout the athlete already has (billed when the AI
 * builds it, not when the steps table does); its
 * confirmations live in `MatchedWorkoutActions`.
 */
import type { Movability } from "../../../application/session-movability";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchedActionButton } from "./matched-action-button";
import { MatchedWorkoutButtons } from "./matched-workout-buttons";
import { MoveSessionAction } from "./MoveSessionAction";

export type MatchedActionsProps = {
  workout: WorkoutRecord;
  splitting: boolean;
  onClose: () => void;
  onOpenEditor: () => void;
  onAiProcess: () => void;
  onPushToGarmin: () => void;
  onSplit: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  movability?: Movability;
  onMoveTo?: (date: string) => void;
};

export function MatchedActions(props: MatchedActionsProps) {
  const t = useTranslate("coaching");
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-3">
      <button
        type="button"
        onClick={props.onClose}
        className="rounded-md border border-edge px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {t("actions.close")}
      </button>
      <MatchedActionButton
        testId="coaching-dialog-split"
        disabled={props.splitting}
        onClick={props.onSplit}
      >
        {props.splitting ? t("actions.splitting") : t("actions.split")}
      </MatchedActionButton>
      <MatchedActionButton
        testId="coaching-dialog-delete-workout"
        onClick={props.onDelete}
      >
        {t("actions.deleteWorkout")}
      </MatchedActionButton>
      <MoveSessionAction
        date={props.workout.date}
        movability={props.movability}
        onMoveTo={props.onMoveTo}
      />
      <MatchedWorkoutButtons {...props} />
    </div>
  );
}

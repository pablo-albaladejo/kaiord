import { canRegenerate } from "../../../application/coaching/regenerate-warnings";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchedActionButton } from "./matched-action-button";

export type MatchedWorkoutButtonsProps = {
  workout: WorkoutRecord;
  onOpenEditor: () => void;
  onAiProcess: () => void;
  onPushToGarmin: () => void;
  onRegenerate: () => void;
};

/** The state-dependent half of the bar: Send, Regenerate, Process, Open. */
export function MatchedWorkoutButtons(props: MatchedWorkoutButtonsProps) {
  const t = useTranslate("coaching");
  const state = props.workout.state;
  const showAi = state === "raw";
  const showRegenerate = canRegenerate(state);
  const showPush = state === "structured" || state === "ready";
  return (
    <>
      {showPush && (
        <MatchedActionButton
          testId="coaching-dialog-push"
          onClick={props.onPushToGarmin}
        >
          {t("actions.pushToGarmin")}
        </MatchedActionButton>
      )}
      {showRegenerate && (
        <MatchedActionButton
          testId="coaching-dialog-regenerate"
          onClick={props.onRegenerate}
        >
          {t("actions.regenerate")}
        </MatchedActionButton>
      )}
      {showAi && (
        <button
          type="button"
          data-testid="coaching-dialog-ai-process"
          onClick={props.onAiProcess}
          className="rounded-md bg-danger px-3 py-1 text-sm text-white hover:bg-danger"
        >
          {t("actions.processWithAi")}
        </button>
      )}
      <button
        type="button"
        data-testid="coaching-dialog-open-editor"
        onClick={props.onOpenEditor}
        className="rounded-md bg-surface-elevated px-3 py-1 text-sm text-ink-strong hover:bg-surface"
      >
        {t("actions.openEditor")}
      </button>
    </>
  );
}

/**
 * Editor Workflow Bar
 *
 * Shows state-specific actions: Accept, Push, Modified indicator.
 */

import { Check, Upload } from "lucide-react";

import { useTranslate } from "../../i18n/use-translate";
import type { WorkoutState } from "../../types/calendar-enums";
import { Button } from "../atoms/Button/Button";
import { ModifiedIndicator } from "../molecules/ModifiedIndicator";

type EditorWorkflowBarProps = {
  state: WorkoutState;
  onAccept: () => void;
  onPush: () => void;
  onRepush: () => void;
};

export function EditorWorkflowBar({
  state,
  onAccept,
  onPush,
  onRepush,
}: EditorWorkflowBarProps) {
  const t = useTranslate("editor");
  if (state === "structured") {
    return (
      <div className="flex items-center gap-3" data-testid="workflow-bar">
        <Button onClick={onAccept}>
          <Check className="mr-2 h-4 w-4" />
          {t("workflow.acceptWorkout")}
        </Button>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="flex items-center gap-3" data-testid="workflow-bar">
        <Button onClick={onPush}>
          <Upload className="mr-2 h-4 w-4" />
          {t("workflow.pushToGarmin")}
        </Button>
      </div>
    );
  }

  if (state === "modified") {
    return (
      <div data-testid="workflow-bar">
        <ModifiedIndicator onRepush={onRepush} />
      </div>
    );
  }

  return null;
}

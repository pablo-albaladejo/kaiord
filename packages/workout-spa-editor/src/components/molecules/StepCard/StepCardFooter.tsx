import { isAiNote } from "@kaiord/core";

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutStep } from "../../../types/krd";
import { Badge } from "../../atoms/Badge/Badge";
import { Icon } from "../../atoms/Icon/Icon";
import { AiNoteLabel } from "../StepNotesEditor/AiNoteLabel";
import { targetTypeLabel } from "./format-target";
import { getTargetIcon } from "./icons";

export type StepCardFooterProps = {
  step: WorkoutStep;
};

export function StepCardFooter({ step }: StepCardFooterProps) {
  const t = useTranslate("editor");
  const targetIcon = getTargetIcon(step.targetType);

  return (
    <>
      <div className="mt-3">
        <Badge
          variant={step.targetType}
          size="sm"
          icon={<Icon icon={targetIcon} size="xs" />}
        >
          {targetTypeLabel(step.targetType, t)}
        </Badge>
      </div>

      {step.notes && (
        <p className="mt-3 text-xs text-ink-muted italic">
          {isAiNote(step) && <AiNoteLabel />}
          {step.notes}
        </p>
      )}
    </>
  );
}

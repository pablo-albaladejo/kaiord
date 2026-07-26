/**
 * RawWorkoutActions - Action buttons for raw workout dialog.
 */

import { Bot, PenLine, SkipForward, Undo2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { ActionBtn } from "./ActionBtn";

export type RawWorkoutActionsProps = {
  workout: WorkoutRecord;
  selected: Set<number>;
  onProcess: (id: string, indices: number[]) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
  onManual: () => void;
  disabled?: boolean;
};

export function RawWorkoutActions({
  workout,
  selected,
  onProcess,
  onSkip,
  onUnskip,
  onManual,
  disabled = false,
}: RawWorkoutActionsProps) {
  const t = useTranslate("editor");
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {workout.state === "raw" && (
        <>
          <ActionBtn
            icon={Bot}
            label={t("raw.processWithAi")}
            onClick={() => onProcess(workout.id, Array.from(selected))}
            primary
            disabled={disabled}
          />
          <ActionBtn
            icon={SkipForward}
            label={t("raw.skip")}
            onClick={() => onSkip(workout.id)}
            disabled={disabled}
          />
        </>
      )}
      {workout.state === "skipped" && (
        <ActionBtn
          icon={Undo2}
          label={t("raw.unskip")}
          onClick={() => onUnskip(workout.id)}
          disabled={disabled}
        />
      )}
      <ActionBtn
        icon={PenLine}
        label={t("raw.createWorkout")}
        onClick={onManual}
        disabled={disabled}
      />
    </div>
  );
}

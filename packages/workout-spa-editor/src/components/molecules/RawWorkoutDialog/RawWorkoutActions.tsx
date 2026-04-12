/**
 * RawWorkoutActions - Action buttons for raw workout dialog.
 */

import { Bot, PenLine, SkipForward, Undo2 } from "lucide-react";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { ActionBtn } from "./ActionBtn";

export type RawWorkoutActionsProps = {
  workout: WorkoutRecord;
  selected: Set<number>;
  onProcess: (id: string, indices: number[]) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
  onManual: () => void;
};

export function RawWorkoutActions({
  workout,
  selected,
  onProcess,
  onSkip,
  onUnskip,
  onManual,
}: RawWorkoutActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {workout.state === "raw" && (
        <>
          <ActionBtn
            icon={Bot}
            label="Process with AI"
            onClick={() => onProcess(workout.id, Array.from(selected))}
            primary
          />
          <ActionBtn
            icon={SkipForward}
            label="Skip"
            onClick={() => onSkip(workout.id)}
          />
        </>
      )}
      {workout.state === "skipped" && (
        <ActionBtn
          icon={Undo2}
          label="Un-skip"
          onClick={() => onUnskip(workout.id)}
        />
      )}
      <ActionBtn icon={PenLine} label="Create manually" onClick={onManual} />
    </div>
  );
}

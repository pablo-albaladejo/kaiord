import type { Workout } from "../../../types/krd";
import { WorkoutList } from "../../organisms/WorkoutList/WorkoutList";
import { WorkoutStepsListActions } from "./WorkoutStepsListActions";

type WorkoutStepsListProps = {
  readonly workout: Workout;
  readonly selectedStepId: string | null;
  readonly selectedStepIds: readonly string[];
  readonly onStepSelect: (stepId: string) => void;
  readonly onToggleStepSelection: (stepId: string) => void;
  readonly onStepDelete: (stepIndex: number) => void;
  readonly onStepDuplicate: (stepIndex: number) => void;
  readonly onStepCopy: (stepIndex: number) => void;
  readonly onStepPaste?: () => void;
  readonly onStepReorder: (activeIndex: number, overIndex: number) => void;
  readonly onReorderStepsInBlock?: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void;
  readonly onAddStep: () => void;
  readonly onCreateRepetitionBlock: () => void;
  readonly onCreateEmptyRepetitionBlock: () => void;
  readonly onEditRepetitionBlock: (
    blockId: string,
    repeatCount: number
  ) => void;
  readonly onAddStepToRepetitionBlock: (blockId: string) => void;
  readonly onUngroupRepetitionBlock?: (blockId: string) => void;
  readonly onDeleteRepetitionBlock?: (blockId: string) => void;
  readonly onDuplicateStepInRepetitionBlock: (
    blockId: string,
    stepIndex: number
  ) => void;
};

export function WorkoutStepsList({
  workout,
  selectedStepId,
  selectedStepIds,
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onStepCopy,
  onStepPaste,
  onStepReorder,
  onReorderStepsInBlock,
  onAddStep,
  onCreateRepetitionBlock,
  onCreateEmptyRepetitionBlock,
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
  onUngroupRepetitionBlock,
  onDeleteRepetitionBlock,
  onDuplicateStepInRepetitionBlock,
}: WorkoutStepsListProps) {
  const hasMultipleSelection = selectedStepIds.length >= 2;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <WorkoutList
        workout={workout}
        selectedStepId={selectedStepId}
        selectedStepIds={selectedStepIds}
        onStepSelect={onStepSelect}
        onToggleStepSelection={onToggleStepSelection}
        onStepDelete={onStepDelete}
        onStepDuplicate={onStepDuplicate}
        onStepCopy={onStepCopy}
        onStepReorder={onStepReorder}
        onReorderStepsInBlock={onReorderStepsInBlock}
        onDuplicateStepInRepetitionBlock={onDuplicateStepInRepetitionBlock}
        onEditRepetitionBlock={onEditRepetitionBlock}
        onAddStepToRepetitionBlock={onAddStepToRepetitionBlock}
        onUngroupRepetitionBlock={onUngroupRepetitionBlock}
        onDeleteRepetitionBlock={onDeleteRepetitionBlock}
        onAddStep={onAddStep}
      />

      <WorkoutStepsListActions
        hasMultipleSelection={hasMultipleSelection}
        selectedStepCount={selectedStepIds.length}
        onCreateRepetitionBlock={onCreateRepetitionBlock}
        onCreateEmptyRepetitionBlock={onCreateEmptyRepetitionBlock}
        onAddStep={onAddStep}
        onPasteStep={onStepPaste}
      />
    </div>
  );
}

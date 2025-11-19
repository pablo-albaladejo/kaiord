import type { Workout } from "../../../types/krd";
import { WorkoutList } from "../../organisms/WorkoutList/WorkoutList";
import { WorkoutStepsListActions } from "./WorkoutStepsListActions";

type WorkoutStepsListProps = {
  readonly workout: Workout;
  readonly selectedStepId: string | null;
  readonly selectedStepIds: readonly string[];
  readonly onStepSelect: (stepIndex: number) => void;
  readonly onToggleStepSelection: (stepIndex: number) => void;
  readonly onStepDelete: (stepIndex: number) => void;
  readonly onStepDuplicate: (stepIndex: number) => void;
  readonly onStepReorder: (activeIndex: number, overIndex: number) => void;
  readonly onReorderStepsInBlock?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
  readonly onAddStep: () => void;
  readonly onCreateRepetitionBlock: () => void;
  readonly onCreateEmptyRepetitionBlock: () => void;
  readonly onEditRepetitionBlock: (
    blockIndex: number,
    repeatCount: number
  ) => void;
  readonly onAddStepToRepetitionBlock: (blockIndex: number) => void;
  readonly onDuplicateStepInRepetitionBlock: (
    blockIndex: number,
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
  onStepReorder,
  onReorderStepsInBlock,
  onAddStep,
  onCreateRepetitionBlock,
  onCreateEmptyRepetitionBlock,
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
  onDuplicateStepInRepetitionBlock,
}: WorkoutStepsListProps) {
  const hasMultipleSelection = selectedStepIds.length >= 2;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
      <WorkoutList
        workout={workout}
        selectedStepId={selectedStepId}
        selectedStepIds={selectedStepIds}
        onStepSelect={onStepSelect}
        onToggleStepSelection={onToggleStepSelection}
        onStepDelete={onStepDelete}
        onStepDuplicate={onStepDuplicate}
        onStepReorder={onStepReorder}
        onReorderStepsInBlock={onReorderStepsInBlock}
        onDuplicateStepInRepetitionBlock={onDuplicateStepInRepetitionBlock}
        onEditRepetitionBlock={onEditRepetitionBlock}
        onAddStepToRepetitionBlock={onAddStepToRepetitionBlock}
      />

      <WorkoutStepsListActions
        hasMultipleSelection={hasMultipleSelection}
        selectedStepCount={selectedStepIds.length}
        onCreateRepetitionBlock={onCreateRepetitionBlock}
        onCreateEmptyRepetitionBlock={onCreateEmptyRepetitionBlock}
        onAddStep={onAddStep}
      />
    </div>
  );
}

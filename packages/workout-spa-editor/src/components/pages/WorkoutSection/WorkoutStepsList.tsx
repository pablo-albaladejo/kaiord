import { Repeat } from "lucide-react";
import type { Workout } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { WorkoutList } from "../../organisms/WorkoutList/WorkoutList";

type WorkoutStepsListProps = {
  workout: Workout;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  onStepSelect: (stepIndex: number) => void;
  onToggleStepSelection: (stepIndex: number) => void;
  onStepDelete: (stepIndex: number) => void;
  onStepDuplicate: (stepIndex: number) => void;
  onAddStep: () => void;
  onCreateRepetitionBlock: () => void;
  onEditRepetitionBlock: (blockIndex: number, repeatCount: number) => void;
  onAddStepToRepetitionBlock: (blockIndex: number) => void;
};

export function WorkoutStepsList({
  workout,
  selectedStepId,
  selectedStepIds,
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onAddStep,
  onCreateRepetitionBlock,
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
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
        onEditRepetitionBlock={onEditRepetitionBlock}
        onAddStepToRepetitionBlock={onAddStepToRepetitionBlock}
      />

      <div className="mt-4 flex justify-center gap-2">
        {hasMultipleSelection && (
          <Button
            variant="primary"
            onClick={onCreateRepetitionBlock}
            aria-label="Create repetition block from selected steps"
            data-testid="create-repetition-block-button"
          >
            <Repeat className="mr-2 h-4 w-4" />
            Create Repetition Block ({selectedStepIds.length} steps)
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={onAddStep}
          aria-label="Add new step to workout"
          data-testid="add-step-button"
        >
          Add Step
        </Button>
      </div>
    </div>
  );
}

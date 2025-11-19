import { Plus, Repeat } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

type WorkoutStepsListActionsProps = {
  readonly hasMultipleSelection: boolean;
  readonly selectedStepCount: number;
  readonly onCreateRepetitionBlock: () => void;
  readonly onCreateEmptyRepetitionBlock: () => void;
  readonly onAddStep: () => void;
};

export function WorkoutStepsListActions({
  hasMultipleSelection,
  selectedStepCount,
  onCreateRepetitionBlock,
  onCreateEmptyRepetitionBlock,
  onAddStep,
}: WorkoutStepsListActionsProps) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
      {hasMultipleSelection && (
        <Button
          variant="primary"
          onClick={onCreateRepetitionBlock}
          aria-label="Create repetition block from selected steps"
          data-testid="create-repetition-block-button"
          className="w-full sm:w-auto"
        >
          <Repeat className="mr-2 h-4 w-4" />
          Create Repetition Block ({selectedStepCount} steps)
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={onCreateEmptyRepetitionBlock}
        aria-label="Add repetition block"
        data-testid="create-empty-repetition-block-button"
        className="w-full sm:w-auto"
      >
        <Repeat className="mr-2 h-4 w-4" />
        Add Repetition
      </Button>
      <Button
        variant="secondary"
        onClick={onAddStep}
        aria-label="Add new step to workout"
        data-testid="add-step-button"
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>
    </div>
  );
}

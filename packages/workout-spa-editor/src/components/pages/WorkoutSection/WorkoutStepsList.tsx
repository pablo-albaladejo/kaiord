import type { Workout } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { WorkoutList } from "../../organisms/WorkoutList/WorkoutList";

type WorkoutStepsListProps = {
  workout: Workout;
  selectedStepId: string | null;
  onStepSelect: (stepIndex: number) => void;
  onStepDelete: (stepIndex: number) => void;
  onStepDuplicate: (stepIndex: number) => void;
  onAddStep: () => void;
};

export function WorkoutStepsList({
  workout,
  selectedStepId,
  onStepSelect,
  onStepDelete,
  onStepDuplicate,
  onAddStep,
}: WorkoutStepsListProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <WorkoutList
        workout={workout}
        selectedStepId={selectedStepId}
        onStepSelect={onStepSelect}
        onStepDelete={onStepDelete}
        onStepDuplicate={onStepDuplicate}
      />

      <div className="mt-4 flex justify-center">
        <Button
          variant="secondary"
          onClick={onAddStep}
          aria-label="Add new step to workout"
        >
          Add Step
        </Button>
      </div>
    </div>
  );
}

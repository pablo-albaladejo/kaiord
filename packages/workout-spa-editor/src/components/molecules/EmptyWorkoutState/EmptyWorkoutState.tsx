import { ListPlus } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

export type EmptyWorkoutStateProps = {
  onAddStep: () => void;
};

export function EmptyWorkoutState({ onAddStep }: EmptyWorkoutStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="empty-workout-state"
    >
      <ListPlus
        className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Add your first step
      </h3>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
        Start building your workout by adding steps
      </p>
      <Button
        variant="primary"
        onClick={onAddStep}
        aria-label="Add first step to workout"
        data-testid="add-first-step-button"
      >
        <ListPlus className="mr-2 h-4 w-4" aria-hidden="true" />
        Add Step
      </Button>
      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Press{" "}
        <kbd className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700">
          A
        </kbd>{" "}
        to add a step
      </p>
    </div>
  );
}

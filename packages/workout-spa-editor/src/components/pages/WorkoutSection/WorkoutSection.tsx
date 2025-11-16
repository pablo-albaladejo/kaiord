import {
  useCreateStep,
  useIsEditing,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { SaveButton } from "../../molecules";
import { StepEditor } from "../../organisms/StepEditor/StepEditor";
import { WorkoutList } from "../../organisms/WorkoutList/WorkoutList";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";

export type WorkoutSectionProps = {
  workout: Workout;
  krd: KRD;
  selectedStepId: string | null;
  onStepSelect: (stepIndex: number) => void;
};

/**
 * WorkoutSection Component
 *
 * Displays workout information, statistics, and step list.
 * Implements step editing flow when a step is selected.
 *
 * Requirements:
 * - Requirement 1: Display workout structure
 * - Requirement 3: Edit existing workout steps
 * - Requirement 9: Display workout statistics with real-time updates
 */
export function WorkoutSection({
  workout,
  krd,
  selectedStepId,
  onStepSelect,
}: WorkoutSectionProps) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const { handleStepSelect, handleSave, handleCancel } =
    useWorkoutSectionHandlers(workout, krd, onStepSelect);

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workout.name || "Untitled Workout"}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Sport: {workout.sport}
              {workout.subSport && ` • ${workout.subSport}`}
            </p>
          </div>
          <SaveButton workout={krd} />
        </div>
      </div>

      <WorkoutStats workout={workout} />

      {isEditing && selectedStep && (
        <StepEditor
          step={selectedStep}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <WorkoutList
          workout={workout}
          selectedStepId={selectedStepId}
          onStepSelect={handleStepSelect}
        />

        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            onClick={createStep}
            aria-label="Add new step to workout"
          >
            Add Step
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useMemo } from "react";
import {
  useIsEditing,
  useSelectStep,
  useSetEditing,
  useUpdateWorkout,
} from "../../store/workout-store-selectors";
import type { KRD, Workout, WorkoutStep } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import { SaveButton } from "../molecules";
import { StepEditor } from "../organisms/StepEditor/StepEditor";
import { WorkoutList } from "../organisms/WorkoutList/WorkoutList";
import { WorkoutStats } from "../organisms/WorkoutStats/WorkoutStats";

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
  const setEditing = useSetEditing();
  const selectStep = useSelectStep();
  const updateWorkout = useUpdateWorkout();

  // Find the selected step from the workout
  const selectedStep = useMemo(() => {
    if (!selectedStepId) return null;

    // Extract step index from ID (format: "step-{index}")
    const stepIndex = Number.parseInt(selectedStepId.replace("step-", ""), 10);
    if (Number.isNaN(stepIndex)) return null;

    // Search through all steps including those in repetition blocks
    for (const item of workout.steps) {
      if (isRepetitionBlock(item)) {
        const step = item.steps.find((s) => s.stepIndex === stepIndex);
        if (step) return step;
      } else if (item.stepIndex === stepIndex) {
        return item;
      }
    }

    return null;
  }, [selectedStepId, workout.steps]);

  // Handle step selection - open editor
  const handleStepSelect = useCallback(
    (stepIndex: number) => {
      onStepSelect(stepIndex);
      setEditing(true);
    },
    [onStepSelect, setEditing]
  );

  // Handle save - update workout and close editor
  const handleSave = useCallback(
    (updatedStep: WorkoutStep) => {
      // Create a deep copy of the workout to update
      const updatedWorkout: Workout = {
        ...workout,
        steps: workout.steps.map((item) => {
          if (isRepetitionBlock(item)) {
            // Update step within repetition block
            return {
              ...item,
              steps: item.steps.map((s) =>
                s.stepIndex === updatedStep.stepIndex ? updatedStep : s
              ),
            };
          }
          // Update regular step
          return item.stepIndex === updatedStep.stepIndex ? updatedStep : item;
        }),
      };

      // Update the KRD with the modified workout
      const updatedKrd: KRD = {
        ...krd,
        extensions: {
          ...krd.extensions,
          workout: updatedWorkout,
        },
      };

      // Update store and close editor
      updateWorkout(updatedKrd);
      setEditing(false);
      selectStep(null);
    },
    [workout, krd, updateWorkout, setEditing, selectStep]
  );

  // Handle cancel - close editor without saving
  const handleCancel = useCallback(() => {
    setEditing(false);
    selectStep(null);
  }, [setEditing, selectStep]);

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
          {/* Save Button - Requirements 6, 36 */}
          <SaveButton workout={krd} />
        </div>
      </div>

      {/* Workout Statistics - Requirement 9 */}
      <WorkoutStats workout={workout} />

      {/* Step Editor - Requirement 3 */}
      {isEditing && selectedStep && (
        <StepEditor
          step={selectedStep}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Workout Steps List */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <WorkoutList
          workout={workout}
          selectedStepId={selectedStepId}
          onStepSelect={handleStepSelect}
        />
      </div>
    </div>
  );
}

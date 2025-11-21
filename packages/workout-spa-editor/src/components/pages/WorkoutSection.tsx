import type { Workout } from "../../types/krd";
import { WorkoutList } from "../organisms/WorkoutList/WorkoutList";

export type WorkoutSectionProps = {
  workout: Workout;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
};

export function WorkoutSection({
  workout,
  selectedStepId,
  onStepSelect,
}: WorkoutSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {workout.name || "Untitled Workout"}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sport: {workout.sport}
            {workout.subSport && ` • ${workout.subSport}`}
          </p>
        </div>
      </div>

      <WorkoutList
        workout={workout}
        selectedStepId={selectedStepId}
        onStepSelect={onStepSelect}
      />
    </div>
  );
}

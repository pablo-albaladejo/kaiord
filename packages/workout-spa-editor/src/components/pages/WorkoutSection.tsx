import type { Workout } from "../../types/krd";
import { WorkoutList } from "../organisms/WorkoutList/WorkoutList";

export type WorkoutSectionProps = {
  workout: Workout;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
};

// Title-case a snake_case sport/subSport token so values such as
// `flexibility_training` render as "Flexibility Training".
const humanizeSport = (value: string): string =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function WorkoutSection({
  workout,
  selectedStepId,
  onStepSelect,
}: WorkoutSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {workout.name || "Untitled Workout"}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sport: {humanizeSport(workout.sport)}
            {workout.subSport && ` • ${humanizeSport(workout.subSport)}`}
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

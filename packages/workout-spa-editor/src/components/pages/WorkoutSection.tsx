import type { KRD, Workout } from "../../types/krd";
import { SaveButton } from "../molecules";
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
 *
 * Requirements:
 * - Requirement 1: Display workout structure
 * - Requirement 9: Display workout statistics with real-time updates
 */
export function WorkoutSection({
  workout,
  krd,
  selectedStepId,
  onStepSelect,
}: WorkoutSectionProps) {
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

      {/* Workout Steps List */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <WorkoutList
          workout={workout}
          selectedStepId={selectedStepId}
          onStepSelect={onStepSelect}
        />
      </div>
    </div>
  );
}

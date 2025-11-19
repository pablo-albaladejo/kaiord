import { Trash2 } from "lucide-react";
import { useClearWorkout } from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { SaveButton } from "../../molecules/SaveButton/SaveButton";

type WorkoutHeaderProps = {
  readonly workout: Workout;
  readonly krd: KRD;
};

export function WorkoutHeader({ workout, krd }: WorkoutHeaderProps) {
  const clearWorkout = useClearWorkout();

  const handleDiscard = () => {
    clearWorkout();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
            {workout.name || "Untitled Workout"}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
            Sport: {workout.sport}
            {workout.subSport && ` • ${workout.subSport}`}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
          <div className="w-full sm:w-auto">
            <SaveButton workout={krd} />
          </div>
          <Button
            variant="secondary"
            onClick={handleDiscard}
            aria-label="Discard workout and return to welcome screen"
            data-testid="discard-workout-button"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Edit2 } from "lucide-react";
import type { Workout } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";

type WorkoutTitleProps = {
  workout: Workout;
  onEdit: () => void;
};

export function WorkoutTitle({ workout, onEdit }: WorkoutTitleProps) {
  return (
    <div className="min-w-0 flex-1 text-left">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {workout.name || "Untitled Workout"}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label="Edit workout metadata"
          data-testid="edit-metadata-button"
          className="h-8 w-8 p-0"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Sport: {workout.sport}
        {workout.subSport && ` • ${workout.subSport}`}
      </p>
    </div>
  );
}

import { Edit2 } from "lucide-react";
import type { RefObject } from "react";

import type { Workout } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";

type WorkoutTitleProps = {
  workout: Workout;
  onEdit: () => void;
  /**
   * Ref to the `<h2>` — `useFocusAfterAction` (§7.5 fallback chain)
   * lands focus here as the last-resort fallback when nothing else
   * in the registry resolves.
   */
  titleRef?: RefObject<HTMLHeadingElement | null>;
};

export function WorkoutTitle({ workout, onEdit, titleRef }: WorkoutTitleProps) {
  return (
    <div className="min-w-0 flex-1 text-left">
      <div className="flex items-center gap-2">
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-bold text-gray-900 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-white dark:focus-visible:ring-offset-gray-800"
        >
          {workout.name || "Untitled Workout"}
        </h2>
        <Button
          variant="tertiary"
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

/**
 * Card Header Component
 *
 * Displays workout name and delete button
 */

import { Trash2 } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";

type CardHeaderProps = {
  workoutName: string;
  onDelete: () => void;
};

export function CardHeader({ workoutName, onDelete }: CardHeaderProps) {
  return (
    <div className="p-4 pb-2">
      <div className="flex items-start justify-between">
        <h3 className="line-clamp-2 text-base font-semibold">{workoutName}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={`Delete ${workoutName}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

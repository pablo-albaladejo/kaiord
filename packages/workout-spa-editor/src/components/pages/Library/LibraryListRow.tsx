import { Play } from "lucide-react";

import type { Profile } from "../../../types/profile";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { LibraryCard } from "../../molecules/LibraryCard";
import { buildLibraryCardModel } from "./library-card-model";

export type LibraryListRowProps = {
  template: WorkoutTemplate;
  profile: Profile | null;
  hasCurrentWorkout: boolean;
  onLoad: () => void;
  onSchedule: () => void;
  onDelete: () => void;
};

export function LibraryListRow({
  template,
  profile,
  hasCurrentWorkout,
  onLoad,
  onSchedule,
  onDelete,
}: LibraryListRowProps) {
  const model = buildLibraryCardModel(template, profile);

  return (
    <div className="space-y-2">
      <LibraryCard {...model} onClick={onLoad} />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={onSchedule}
        >
          <Icon icon={ICON_MAP.calendar} size="sm" color="inherit" />
          Schedule
        </Button>
        {hasCurrentWorkout && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onLoad}
            aria-label={`Load ${template.name} into editor`}
            data-testid="card-load-into-editor"
          >
            <Play className="h-4 w-4" />
            Load
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete ${template.name}`}
        >
          <Icon icon={ICON_MAP.x} size="sm" color="inherit" />
        </Button>
      </div>
    </div>
  );
}

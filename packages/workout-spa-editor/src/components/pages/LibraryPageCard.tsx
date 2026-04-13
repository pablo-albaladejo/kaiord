/**
 * Library Page Card
 *
 * Single template card for the library page with schedule action.
 */

import type { WorkoutTemplate } from "../../types/workout-library";
import { CardBadges } from "../organisms/WorkoutLibrary/components/CardBadges";
import { CardHeader } from "../organisms/WorkoutLibrary/components/CardHeader";
import { CardScheduleAction } from "../organisms/WorkoutLibrary/components/CardScheduleAction";
import { CardTags } from "../organisms/WorkoutLibrary/components/CardTags";
import { CardThumbnail } from "../organisms/WorkoutLibrary/components/CardThumbnail";

type LibraryPageCardProps = {
  template: WorkoutTemplate;
  onDelete: () => void;
  onSchedule: () => void;
};

export function LibraryPageCard({
  template,
  onDelete,
  onSchedule,
}: LibraryPageCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
      data-testid="library-card"
    >
      <CardThumbnail
        thumbnailData={template.thumbnailData}
        workoutName={template.name}
      />
      <CardHeader workoutName={template.name} onDelete={onDelete} />
      <div className="space-y-3 p-4 pt-0">
        <CardBadges
          sport={template.sport}
          difficulty={template.difficulty}
          duration={template.duration}
        />
        {template.tags.length > 0 && <CardTags tags={template.tags} />}
        <CardScheduleAction onSchedule={onSchedule} />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created {new Date(template.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

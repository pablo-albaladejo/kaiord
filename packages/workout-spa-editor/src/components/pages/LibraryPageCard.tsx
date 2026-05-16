/**
 * Library Page Card
 *
 * Single template card for the library page with schedule action.
 *
 * The "Load into editor" CTA renders only when the editor has an
 * active workout (`hasCurrentWorkout`). This preserves the workflow
 * the deleted header-modal previously offered while keeping the
 * page UI clean for the common "browse templates" job.
 */

import { Play } from "lucide-react";

import type { WorkoutTemplate } from "../../types/workout-library";
import { Button } from "../atoms/Button/Button";
import { Card } from "../atoms/Card/Card";
import { CardBadges } from "../organisms/WorkoutLibrary/components/CardBadges";
import { CardHeader } from "../organisms/WorkoutLibrary/components/CardHeader";
import { CardScheduleAction } from "../organisms/WorkoutLibrary/components/CardScheduleAction";
import { CardTags } from "../organisms/WorkoutLibrary/components/CardTags";
import { CardThumbnail } from "../organisms/WorkoutLibrary/components/CardThumbnail";

type LibraryPageCardProps = {
  template: WorkoutTemplate;
  hasCurrentWorkout: boolean;
  onDelete: () => void;
  onSchedule: () => void;
  onLoad: () => void;
};

export function LibraryPageCard({
  template,
  hasCurrentWorkout,
  onDelete,
  onSchedule,
  onLoad,
}: LibraryPageCardProps) {
  return (
    <Card variant="interactive" data-testid="library-card">
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
        {hasCurrentWorkout && (
          <Button
            onClick={onLoad}
            variant="secondary"
            size="sm"
            className="w-full"
            aria-label={`Load ${template.name} into editor`}
            data-testid="card-load-into-editor"
          >
            <Play className="mr-2 h-4 w-4" />
            Load into editor
          </Button>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created {new Date(template.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}

/**
 * Workout Card Component
 *
 * Displays a single workout template in the library grid.
 */

import { useState } from "react";
import { CardActions } from "./CardActions";
import { CardBadges } from "./CardBadges";
import { CardHeader } from "./CardHeader";
import { CardTags } from "./CardTags";
import { CardThumbnail } from "./CardThumbnail";
import { DeleteWorkoutDialog } from "./DeleteWorkoutDialog";
import type { WorkoutTemplate } from "../../../../types/workout-library";

type WorkoutCardProps = {
  template: WorkoutTemplate;
  onLoad: (template: WorkoutTemplate) => void;
  onDelete: (templateId: string) => void;
  onPreview: (template: WorkoutTemplate) => void;
};

export function WorkoutCard({
  template,
  onLoad,
  onDelete,
  onPreview,
}: WorkoutCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(template.id);
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        data-testid="workout-card"
      >
        <CardThumbnail
          thumbnailData={template.thumbnailData}
          workoutName={template.name}
        />

        <CardHeader workoutName={template.name} onDelete={handleDeleteClick} />

        <div className="space-y-3 p-4 pt-0">
          <CardBadges
            sport={template.sport}
            difficulty={template.difficulty}
            duration={template.duration}
          />

          {template.tags && template.tags.length > 0 && (
            <CardTags tags={template.tags} />
          )}

          {template.notes && (
            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {template.notes}
            </p>
          )}

          <CardActions
            onPreview={() => onPreview(template)}
            onLoad={() => onLoad(template)}
          />

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Created {new Date(template.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <DeleteWorkoutDialog
        open={showDeleteDialog}
        workoutName={template.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}

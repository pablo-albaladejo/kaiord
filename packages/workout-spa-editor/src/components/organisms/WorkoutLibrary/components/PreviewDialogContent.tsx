/**
 * Preview Dialog Content Component
 *
 * Content section of the workout preview dialog.
 */

import { Badge } from "../../../atoms/Badge/Badge";
import { Button } from "../../../atoms/Button/Button";
import { formatDuration } from "../utils/card-helpers";
import type { WorkoutTemplate } from "../../../../types/workout-library";

type PreviewDialogContentProps = {
  template: WorkoutTemplate;
  onClose: () => void;
  onLoad: (template: WorkoutTemplate) => void;
};

export function PreviewDialogContent({
  template,
  onClose,
  onLoad,
}: PreviewDialogContentProps) {
  return (
    <div className="space-y-4">
      {template.thumbnailData && (
        <div className="aspect-video overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
          <img
            src={template.thumbnailData}
            alt={`${template.name} preview`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="default">{template.sport}</Badge>
        {template.difficulty && (
          <Badge variant="default">{template.difficulty}</Badge>
        )}
        {template.duration && (
          <Badge variant="default">{formatDuration(template.duration)}</Badge>
        )}
      </div>

      {template.tags && template.tags.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags
          </h4>
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="default" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {template.notes && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {template.notes}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => onLoad(template)}>Load Workout</Button>
      </div>
    </div>
  );
}

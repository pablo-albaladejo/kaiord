/**
 * Workout Card Component
 *
 * Displays a single workout template in the library grid.
 */

import { Play, Trash2 } from "lucide-react";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import { Badge } from "../../../atoms/Badge/Badge";
import { Button } from "../../../atoms/Button/Button";

type WorkoutCardProps = {
  template: WorkoutTemplate;
  onLoad: (template: WorkoutTemplate) => void;
  onDelete: (templateId: string) => void;
}

export function WorkoutCard({ template, onLoad, onDelete }: WorkoutCardProps) {
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      onDelete(template.id);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
      data-testid="workout-card"
    >
      {template.thumbnailData && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={template.thumbnailData}
            alt={`${template.name} preview`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <h3 className="line-clamp-2 text-base font-semibold">
            {template.name}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={`Delete ${template.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="text-xs">
            {template.sport}
          </Badge>
          {template.difficulty && (
            <Badge
              className={`text-xs ${getDifficultyColor(template.difficulty)}`}
            >
              {template.difficulty}
            </Badge>
          )}
          {template.duration && (
            <Badge variant="default" className="text-xs">
              {formatDuration(template.duration)}
            </Badge>
          )}
        </div>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="default" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {template.notes && (
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {template.notes}
          </p>
        )}

        <Button onClick={() => onLoad(template)} className="w-full" size="sm">
          <Play className="mr-2 h-4 w-4" />
          Load Workout
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created {new Date(template.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

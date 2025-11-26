/**
 * Preview Dialog Component
 *
 * Shows detailed preview of a workout template.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import { Badge } from "../../../atoms/Badge/Badge";
import { Button } from "../../../atoms/Button/Button";

type PreviewDialogProps = {
  template: WorkoutTemplate | null;
  onClose: () => void;
  onLoad: (template: WorkoutTemplate) => void;
};

export function PreviewDialog({
  template,
  onClose,
  onLoad,
}: PreviewDialogProps) {
  if (!template) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Dialog.Root open={!!template} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {template.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

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
                <Badge variant="default">
                  {formatDuration(template.duration)}
                </Badge>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

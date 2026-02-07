/**
 * Preview Dialog Component
 *
 * Shows detailed preview of a workout template.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import { PreviewDialogContent } from "./PreviewDialogContent";

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

  return (
    <Dialog.Root open={!!template} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800"
        >
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

          <PreviewDialogContent
            template={template}
            onClose={onClose}
            onLoad={onLoad}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

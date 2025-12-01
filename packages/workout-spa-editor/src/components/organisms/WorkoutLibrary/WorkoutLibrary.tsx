/**
 * WorkoutLibrary Component
 *
 * Grid view of saved workouts with search, filter, and sort capabilities.
 *
 * Requirements:
 * - Requirement 17: Save workouts to library
 * - Requirement 18: Load workouts from library
 */

import * as Dialog from "@radix-ui/react-dialog";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { LibraryDialogContent } from "./components/LibraryDialogContent";
import { DIALOG_CONTENT_CLASSES, DIALOG_OVERLAY_CLASSES } from "./constants";
import { useWorkoutLibrary } from "./hooks/useWorkoutLibrary";

export type WorkoutLibraryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadWorkout: (template: WorkoutTemplate) => void;
  hasCurrentWorkout?: boolean;
};

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
  open,
  onOpenChange,
  onLoadWorkout,
  hasCurrentWorkout = false,
}) => {
  const {
    templates,
    deleteTemplate,
    previewTemplate,
    setPreviewTemplate,
    handlePreview,
    handleLoadFromPreview,
    filters,
    loader,
  } = useWorkoutLibrary(hasCurrentWorkout, onLoadWorkout, onOpenChange);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content className={DIALOG_CONTENT_CLASSES}>
          <LibraryDialogContent
            templates={templates}
            previewTemplate={previewTemplate}
            filters={filters}
            loader={loader}
            onDeleteWorkout={deleteTemplate}
            onPreviewWorkout={handlePreview}
            onClosePreview={() => setPreviewTemplate(null)}
            onLoadFromPreview={handleLoadFromPreview}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

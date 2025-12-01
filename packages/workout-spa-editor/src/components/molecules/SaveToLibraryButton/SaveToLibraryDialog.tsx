/**
 * SaveToLibraryDialog Component
 *
 * Dialog for saving workouts to the library with tags and notes.
 */

import * as Dialog from "@radix-ui/react-dialog";
import type { KRD } from "../../../types/krd";
import { DialogActions } from "./components/DialogActions";
import { DialogHeader } from "./components/DialogHeader";
import { DifficultySelect } from "./components/DifficultySelect";
import { NotesTextarea } from "./components/NotesTextarea";
import { TagsInput } from "./components/TagsInput";
import { WorkoutNameInput } from "./components/WorkoutNameInput";
import { useSaveToLibrary } from "./useSaveToLibrary";

export type SaveToLibraryDialogProps = {
  workout: KRD;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SaveToLibraryDialog({
  workout,
  open,
  onOpenChange,
}: SaveToLibraryDialogProps) {
  const {
    name,
    setName,
    tags,
    setTags,
    difficulty,
    setDifficulty,
    notes,
    setNotes,
    isSaving,
    handleSave,
  } = useSaveToLibrary(workout, () => onOpenChange(false));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader />

          <div className="space-y-4">
            <WorkoutNameInput
              value={name}
              onChange={setName}
              disabled={isSaving}
            />
            <TagsInput value={tags} onChange={setTags} disabled={isSaving} />
            <DifficultySelect
              value={difficulty}
              onChange={setDifficulty}
              disabled={isSaving}
            />
            <NotesTextarea
              value={notes}
              onChange={setNotes}
              disabled={isSaving}
            />
          </div>

          <DialogActions
            onSave={handleSave}
            isSaving={isSaving}
            isValid={!!name.trim()}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

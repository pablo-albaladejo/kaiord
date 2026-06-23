import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef } from "react";

import type { Profile } from "../../../types/profile";
import { ProfileManagerDialog } from "../../organisms/ProfileManager/components/ProfileManagerDialog";
import { useProfileManager } from "../../organisms/ProfileManager/useProfileManager";

type ProfileEditDialogProps = {
  open: boolean;
  profile: Profile;
  onClose: () => void;
};

/* Reuses the existing ProfileManagerDialog (the same surface Settings
   mounts) inside a Radix dialog. On open we enter edit mode for the
   active profile so the user lands directly on the metadata/zones editor
   rather than the profile list. */
export function ProfileEditDialog({
  open,
  profile,
  onClose,
}: ProfileEditDialogProps) {
  const manager = useProfileManager();
  const { handleEdit } = manager;

  // Enter edit mode once per open. `handleEdit` is recreated every render and
  // writes a fresh `formData` object, so re-running it on each render would
  // loop setState -> render -> setState forever (React "max update depth").
  // Seed only on the closed->open transition; the dialog edits the active
  // profile, which does not change while the dialog is open.
  const seeded = useRef(false);
  useEffect(() => {
    if (!open) {
      seeded.current = false;
      return;
    }
    if (seeded.current) return;
    seeded.current = true;
    handleEdit(profile);
  }, [open, profile, handleEdit]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="sr-only">Edit profile</Dialog.Title>
          <ProfileManagerDialog {...manager} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

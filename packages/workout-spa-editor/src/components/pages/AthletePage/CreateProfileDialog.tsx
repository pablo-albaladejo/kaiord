import * as Dialog from "@radix-ui/react-dialog";

import { useTranslate } from "../../../i18n/use-translate";
import { ProfileManagerDialog } from "../../organisms/ProfileManager/components/ProfileManagerDialog";
import { useProfileManager } from "../../organisms/ProfileManager/useProfileManager";

type CreateProfileDialogProps = {
  open: boolean;
  onClose: () => void;
};

/* In-place profile-creation surface for the Athlete empty state. Mounts
   the same ProfileManagerDialog that Settings uses with no editing target
   (editingProfile stays null), so the user lands on the create form +
   profile list instead of being redirected away. createProfile
   auto-activates the first profile, so AthletePage swaps to the body
   automatically once a profile exists. */
export function CreateProfileDialog({
  open,
  onClose,
}: CreateProfileDialogProps) {
  const t = useTranslate("athlete");
  const manager = useProfileManager();

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-edge bg-surface p-4 shadow-lg">
          <Dialog.Title className="sr-only">
            {t("createProfileTitle")}
          </Dialog.Title>
          <ProfileManagerDialog {...manager} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

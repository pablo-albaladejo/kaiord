import * as Dialog from "@radix-ui/react-dialog";

import { useTranslate } from "../../../i18n/use-translate";
import { ProfileManagerDialog } from "../../organisms/ProfileManager/components/ProfileManagerDialog";
import { useProfileManager } from "../../organisms/ProfileManager/useProfileManager";

/* The manager state lives in its own component so it mounts with the dialog
   content: every open starts in the list view, not wherever the last one
   ended. */
function ManagerBody() {
  const manager = useProfileManager();
  return <ProfileManagerDialog {...manager} />;
}

type ManageAthletesDialogProps = {
  open: boolean;
  onClose: () => void;
};

/** The existing Profile Manager, opened in its list view from the avatar menu. */
export function ManageAthletesDialog({
  open,
  onClose,
}: ManageAthletesDialogProps) {
  const t = useTranslate("nav");
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-edge bg-surface p-4 shadow-lg"
        >
          <Dialog.Title className="sr-only">
            {t("manageAthletesTitle")}
          </Dialog.Title>
          <ManagerBody />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

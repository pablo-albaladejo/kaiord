import * as Dialog from "@radix-ui/react-dialog";

import { SportZoneEditor } from "../../organisms/ZoneEditor";

type ThresholdEditDialogProps = {
  open: boolean;
  profileId: string;
  onClose: () => void;
};

/* Reuses the existing SportZoneEditor (thresholds + zones) inside a Radix
   dialog. The editor manages its own sport tabs and Dexie writes. */
export function ThresholdEditDialog({
  open,
  profileId,
  onClose,
}: ThresholdEditDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="sr-only">Edit thresholds</Dialog.Title>
          <SportZoneEditor profileId={profileId} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * HelpDialog Component
 *
 * Dialog for displaying help and documentation.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { HelpSection } from "../../../pages/HelpSection/HelpSection";

type HelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplayTutorial?: () => void;
};

export function HelpDialog({
  open,
  onOpenChange,
  onReplayTutorial,
}: HelpDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
              Help & Documentation
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-primary-400 dark:data-[state=open]:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <HelpSection onReplayTutorial={onReplayTutorial} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Radix Dialog chrome (overlay + content + a11y description) for
 * CoachingActivityDialog. Extracted so the parent component stays
 * under the per-function line cap.
 */
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export type CoachingDialogShellProps = {
  onClose: () => void;
  children: ReactNode;
};

export function CoachingDialogShell({
  onClose,
  children,
}: CoachingDialogShellProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          data-testid="coaching-activity-dialog"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        >
          <Dialog.Description className="sr-only">
            Coaching activity details with AI/manual creation, match, and split
            actions.
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

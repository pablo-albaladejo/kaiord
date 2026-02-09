/**
 * ConfirmationModal Component
 *
 * A reusable confirmation modal dialog using Radix UI Dialog.
 * Provides focus trap, backdrop dismissal, and keyboard accessibility.
 *
 * Requirements:
 * - Requirement 6.2: Display modal with dim background
 * - Requirement 6.3: Trap keyboard focus within modal
 * - Requirement 6.4: Clearly labeled action buttons
 * - Requirement 6.5: Allow Escape key to dismiss
 * - Requirement 6.6: Prevent background interaction
 * - Requirement 6.7: Restore focus after dismissal
 * - Requirement 6.8: Use warning colors for destructive actions
 * - Requirement 6.9: Adapt to mobile screens
 */

import * as Dialog from "@radix-ui/react-dialog";
import { ConfirmationModalPanel } from "./ConfirmationModalPanel";

export type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant: "default" | "destructive";
};

/**
 * Reusable confirmation modal dialog
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant,
}: ConfirmationModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="modal-backdrop"
          className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-0 shadow-xl dark:bg-gray-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-lg">
          <ConfirmationModalPanel
            title={title}
            message={message}
            confirmLabel={confirmLabel}
            cancelLabel={cancelLabel}
            onConfirm={onConfirm}
            onCancel={onCancel}
            variant={variant}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

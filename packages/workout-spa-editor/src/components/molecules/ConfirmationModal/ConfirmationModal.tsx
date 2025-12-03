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
import { X } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

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
        {/* Backdrop with dim effect */}
        <Dialog.Overlay
          data-testid="modal-backdrop"
          className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />

        {/* Modal content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-0 shadow-xl dark:bg-gray-800 kiroween:bg-gray-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          <Dialog.Description className="p-4 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </Dialog.Description>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "destructive" ? "danger" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

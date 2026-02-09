/**
 * ConfirmationModal Panel
 *
 * The visual dialog panel containing header, message, and action buttons.
 * Extracted from ConfirmationModal to respect file size limits.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

export type ConfirmationModalPanelProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant: "default" | "destructive";
};

export function ConfirmationModalPanel({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant,
}: ConfirmationModalPanelProps) {
  return (
    <div className="w-full max-w-md rounded-lg bg-white p-0 shadow-xl dark:bg-gray-800 sm:max-w-lg">
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

      <Dialog.Description className="p-4 text-sm text-gray-600 dark:text-gray-400">
        {message}
      </Dialog.Description>

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
    </div>
  );
}

/**
 * DialogHeader Component
 *
 * Header section with inline-editable profile name.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type DialogHeaderProps = {
  profileName?: string;
  onNameChange?: (name: string) => void;
};

export function DialogHeader({ profileName, onNameChange }: DialogHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Manager
        </Dialog.Title>
        <Dialog.Close asChild>
          <button
            className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:ring-offset-gray-950"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>

      {profileName !== undefined && onNameChange && (
        <input
          type="text"
          value={profileName}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Profile name"
          className="mb-4 w-full border-b border-transparent bg-transparent text-base font-medium text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:text-white dark:hover:border-gray-600 dark:focus:border-blue-400"
        />
      )}

      <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Manage your training profiles with zones and personal data.
      </Dialog.Description>
    </>
  );
}

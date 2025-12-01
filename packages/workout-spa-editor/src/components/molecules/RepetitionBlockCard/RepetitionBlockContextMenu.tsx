/**
 * RepetitionBlockContextMenu Component
 *
 * Context menu for repetition block actions.
 *
 * Requirements:
 * - Requirement 7.5: Display action menu with Edit Count, Add Step, Ungroup, Delete
 */

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { RepetitionBlockMenuContent } from "./RepetitionBlockMenuContent";

export type RepetitionBlockContextMenuProps = {
  onEditCount: () => void;
  onAddStep: () => void;
  onUngroup: () => void;
  onDelete: () => void;
};

export function RepetitionBlockContextMenu({
  onEditCount,
  onAddStep,
  onUngroup,
  onDelete,
}: RepetitionBlockContextMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900 rounded transition-colors"
          aria-label="Block actions"
          data-testid="block-actions-trigger"
        >
          <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <RepetitionBlockMenuContent
          onEditCount={onEditCount}
          onAddStep={onAddStep}
          onUngroup={onUngroup}
          onDelete={onDelete}
        />
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

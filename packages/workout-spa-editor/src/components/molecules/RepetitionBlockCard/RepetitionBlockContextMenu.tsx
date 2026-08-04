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
          className="rounded p-1 transition-colors hover:bg-[var(--bg-sunken)] motion-reduce:transition-none"
          aria-label="Block actions"
          data-testid="block-actions-trigger"
        >
          <MoreVertical className="h-5 w-5 text-ink-muted" />
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

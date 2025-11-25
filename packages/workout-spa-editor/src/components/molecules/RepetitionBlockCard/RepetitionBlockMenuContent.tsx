import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit, Plus, Trash, Ungroup } from "lucide-react";

type RepetitionBlockMenuContentProps = {
  onEditCount: () => void;
  onAddStep: () => void;
  onUngroup: () => void;
  onDelete: () => void;
};

const menuItemClass =
  "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none";

const deleteItemClass =
  "flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer outline-none";

export const RepetitionBlockMenuContent = ({
  onEditCount,
  onAddStep,
  onUngroup,
  onDelete,
}: RepetitionBlockMenuContentProps) => {
  return (
    <DropdownMenu.Content
      className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50"
      sideOffset={5}
      data-testid="block-actions-menu"
    >
      <DropdownMenu.Item
        className={menuItemClass}
        onSelect={onEditCount}
        data-testid="edit-count-action"
      >
        <Edit className="h-4 w-4" />
        <span>Edit Count</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className={menuItemClass}
        onSelect={onAddStep}
        data-testid="add-step-action"
      >
        <Plus className="h-4 w-4" />
        <span>Add Step</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className={menuItemClass}
        onSelect={onUngroup}
        data-testid="ungroup-action"
      >
        <Ungroup className="h-4 w-4" />
        <span>Ungroup</span>
      </DropdownMenu.Item>

      <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <DropdownMenu.Item
        className={deleteItemClass}
        onSelect={onDelete}
        data-testid="delete-action"
      >
        <Trash className="h-4 w-4" />
        <span>Delete</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  );
};

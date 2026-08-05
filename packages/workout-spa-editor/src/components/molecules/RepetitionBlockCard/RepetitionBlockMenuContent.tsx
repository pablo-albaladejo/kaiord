import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit, Plus, Trash, Ungroup } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";

type RepetitionBlockMenuContentProps = {
  onEditCount: () => void;
  onAddStep: () => void;
  onUngroup: () => void;
  onDelete: () => void;
};

const menuItemClass =
  "flex items-center gap-2 px-3 py-2 text-sm text-ink-body hover:bg-surface-elevated rounded cursor-pointer outline-none";

const deleteItemClass =
  "flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger-text)] hover:bg-[var(--danger-bg)] rounded cursor-pointer outline-none";

export const RepetitionBlockMenuContent = ({
  onEditCount,
  onAddStep,
  onUngroup,
  onDelete,
}: RepetitionBlockMenuContentProps) => {
  const t = useTranslate("editor");
  return (
    <DropdownMenu.Content
      className="min-w-[200px] rounded-lg border border-edge-soft bg-surface p-1 shadow-lg z-50"
      sideOffset={5}
      data-testid="block-actions-menu"
    >
      <DropdownMenu.Item
        className={menuItemClass}
        onSelect={onEditCount}
        data-testid="edit-count-action"
      >
        <Edit className="h-4 w-4" />
        <span>{t("block.editCount")}</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className={menuItemClass}
        onSelect={onAddStep}
        data-testid="add-step-action"
      >
        <Plus className="h-4 w-4" />
        <span>{t("actions.addStep")}</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className={menuItemClass}
        onSelect={onUngroup}
        data-testid="ungroup-action"
      >
        <Ungroup className="h-4 w-4" />
        <span>{t("block.ungroup")}</span>
      </DropdownMenu.Item>

      <DropdownMenu.Separator className="my-1 h-px bg-edge-soft" />

      <DropdownMenu.Item
        className={deleteItemClass}
        onSelect={onDelete}
        data-testid="delete-action"
      >
        <Trash className="h-4 w-4" />
        <span>{t("block.deleteShort")}</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  );
};

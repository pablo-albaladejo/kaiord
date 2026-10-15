import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Pencil, Trash } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { MenuItem } from "../../atoms/MenuItem";

const ITEM =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-ink-body outline-none hover:bg-surface-elevated focus:bg-surface-elevated";
const DANGER =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-danger-text outline-none hover:bg-danger-bg focus:bg-danger-bg";

export function RowMenuContent({
  onRename,
  onRemove,
}: {
  onRename: () => void;
  onRemove: () => void;
}) {
  const t = useTranslate("settings");
  return (
    <DropdownMenu.Content
      align="end"
      sideOffset={5}
      className="z-50 min-w-[180px] rounded-lg border border-edge-soft bg-surface p-1 shadow-lg"
    >
      <MenuItem className={ITEM} onSelect={onRename}>
        <Pencil className="h-4 w-4" />
        <span>{t("accounts.rename")}</span>
      </MenuItem>
      <MenuItem className={DANGER} onSelect={onRemove}>
        <Trash className="h-4 w-4" />
        <span>{t("providers.remove")}</span>
      </MenuItem>
    </DropdownMenu.Content>
  );
}

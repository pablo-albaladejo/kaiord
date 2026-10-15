import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Pencil, Trash } from "lucide-react";
import type { PointerEvent } from "react";

import { useTranslate } from "../../../i18n/use-translate";

// Radix selects an item on a pointerup that began elsewhere (press on the
// trigger, release on the item). When the page is still scrolling, the
// opening press ends over an item and picks it unasked. Cancelling the
// pointerup skips that; a press made on the item still clicks it.
const ignoreForeignRelease = (event: PointerEvent) => event.preventDefault();

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
      <DropdownMenu.Item
        className={ITEM}
        onPointerUp={ignoreForeignRelease}
        onSelect={onRename}
      >
        <Pencil className="h-4 w-4" />
        <span>{t("accounts.rename")}</span>
      </DropdownMenu.Item>
      <DropdownMenu.Item
        className={DANGER}
        onPointerUp={ignoreForeignRelease}
        onSelect={onRemove}
      >
        <Trash className="h-4 w-4" />
        <span>{t("providers.remove")}</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  );
}

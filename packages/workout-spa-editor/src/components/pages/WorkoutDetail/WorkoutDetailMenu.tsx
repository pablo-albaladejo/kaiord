import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CalendarDays, Trash } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type WorkoutDetailMenuProps = {
  onMove: () => void;
  onDelete: () => void;
};

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-ink-body outline-none hover:bg-surface-elevated focus:bg-surface-elevated";
const DELETE_CLASS =
  "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-[var(--danger-text)] outline-none hover:bg-[var(--danger-bg)] focus:bg-[var(--danger-bg)]";

/** The detail's "More options": moving the day (the keyboard alternative
    to dragging the card) and deleting the workout. */
export function WorkoutDetailMenu({
  onMove,
  onDelete,
}: WorkoutDetailMenuProps) {
  const t = useTranslate("workout-detail");
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t("header.moreOptions")}
          data-testid="workout-detail-menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-body hover:bg-ink-strong/5"
        >
          <Icon icon={ICON_MAP.dots} size="md" color="inherit" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={5}
          className="z-50 min-w-[200px] rounded-lg border border-edge-soft bg-surface p-1 shadow-lg"
        >
          <DropdownMenu.Item className={ITEM_CLASS} onSelect={onMove}>
            <CalendarDays className="h-4 w-4" />
            <span>{t("menu.move")}</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={DELETE_CLASS} onSelect={onDelete}>
            <Trash className="h-4 w-4" />
            <span>{t("menu.delete")}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

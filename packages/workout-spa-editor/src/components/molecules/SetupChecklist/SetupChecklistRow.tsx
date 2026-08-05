import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import type { SetupChecklistItem } from "../../../lib/setup-checklist";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type SetupChecklistRowProps = {
  item: SetupChecklistItem;
  /** First not-done item: rendered as the next action, with its hint. */
  isNext: boolean;
};

const rowClasses = (item: SetupChecklistItem, isNext: boolean): string => {
  if (item.done) return "text-ink-muted line-through";
  if (isNext) return "bg-surface-elevated text-ink-strong rounded-lg";
  return "text-ink-body";
};

/**
 * One checklist row. Done rows are inert struck-through text; the next action
 * is a link into the surface that completes it, using the href the item model
 * already composed.
 */
export function SetupChecklistRow({ item, isNext }: SetupChecklistRowProps) {
  const t = useTranslate("setup");
  const label = (
    <span className="flex items-center gap-2">
      {/* Done is said by the tick and the strike-through, not by green:
          success left the palette with warning. */}
      {item.done ? (
        <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
      ) : (
        <span className="border-edge-strong h-3.5 w-3.5 shrink-0 rounded-full border" />
      )}
      <span className={item.done ? "" : "font-semibold"}>
        {t(item.titleKey)}
      </span>
    </span>
  );

  return (
    <li className={`px-2 py-2.5 text-[13.5px] ${rowClasses(item, isNext)}`}>
      {item.done ? (
        label
      ) : (
        <Link
          href={item.href}
          className="block"
          data-testid={`setup-checklist-link-${item.id}`}
        >
          {label}
          {isNext && (
            <span className="text-ink-muted mt-0.5 flex items-center gap-1 pl-6 text-[12px]">
              {t(item.hintKey)}
              <Icon icon={ICON_MAP.chevR} size="xs" color="inherit" />
            </span>
          )}
        </Link>
      )}
    </li>
  );
}

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ComponentType } from "react";
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "./header-menu-styles";
import { isEntryActive } from "./status-entry-active";
import type { EntryDef } from "./status-entry-defs";

type NavMenuProps = {
  /** Trigger id; also the `nav` label key and the trigger's test id. */
  id: string;
  icon: ComponentType<{ className?: string }>;
  entries: readonly EntryDef[];
  /** Visibility of the trigger's own slot in the bar. */
  wrapperClass?: string;
  active: boolean;
};

/**
 * One header dropdown over a list of nav destinations. Used for the Trends
 * parent (its own row plus Labs) and for the "More" overflow below `lg`.
 * Both derive their rows from the nav registry — neither owns a list.
 */
export function NavMenu({
  id,
  icon: TriggerIcon,
  entries,
  wrapperClass,
  active,
}: NavMenuProps) {
  const t = useTranslate("nav");
  const [location, navigate] = useLocation();

  return (
    <span className={wrapperClass}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="tertiary"
            size="sm"
            aria-label={t(`aria.${id}`)}
            aria-current={active ? "page" : undefined}
            className={active ? "text-accent" : undefined}
            data-testid={`status-header-${id}-button`}
          >
            <TriggerIcon className="h-4 w-4" />
            <span className="hidden md:inline">{t(id)}</span>
            <ICON_MAP.chevD className="h-3 w-3" aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className={MENU_CONTENT_CLASS}
            data-testid={`nav-menu-${id}`}
          >
            {entries.map((entry) => (
              <DropdownMenu.Item
                key={entry.id}
                className={`${MENU_ITEM_CLASS} ${entry.bottomNavCovered ? "hidden md:flex" : ""}`}
                aria-current={
                  isEntryActive(entry, location) ? "page" : undefined
                }
                onSelect={() => navigate(entry.to)}
                data-testid={`nav-menu-item-${entry.id}`}
              >
                <entry.icon className="h-4 w-4" />
                {t(entry.id)}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </span>
  );
}

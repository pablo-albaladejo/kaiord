import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { ThemeToggle } from "../../atoms/ThemeToggle";
import {
  ATTENTION_ICON_CLASS,
  MENU_ITEM_CLASS,
  MENU_SEPARATOR_CLASS,
} from "./header-menu-styles";
import { isEntryActive } from "./status-entry-active";
import { ACCOUNT_ENTRIES } from "./status-entry-defs";

const DOCS_URL = "https://kaiord.com/docs/";

type AccountMenuItemsProps = {
  /** The Connections row carries the alert icon when a source needs
      attention, and nothing when none does — the same silence rule as the
      pill. */
  attention: boolean;
};

export function AccountMenuItems({ attention }: AccountMenuItemsProps) {
  const t = useTranslate("nav");
  const [location, navigate] = useLocation();

  return (
    <>
      {ACCOUNT_ENTRIES.map((entry) => (
        <DropdownMenu.Item
          key={entry.id}
          className={MENU_ITEM_CLASS}
          aria-label={entry.ariaLabel ? t(`aria.${entry.id}`) : undefined}
          aria-current={isEntryActive(entry, location) ? "page" : undefined}
          onSelect={() => navigate(entry.to)}
          data-testid={`account-menu-item-${entry.id}`}
        >
          <entry.icon className="h-4 w-4" />
          {t(entry.id)}
          {entry.id === "connections" && attention && (
            <ICON_MAP.alert
              aria-hidden="true"
              className={ATTENTION_ICON_CLASS}
              data-testid="account-menu-connections-attention"
            />
          )}
        </DropdownMenu.Item>
      ))}
      <DropdownMenu.Item asChild className={MENU_ITEM_CLASS}>
        <a href={DOCS_URL} target="_blank" rel="noreferrer">
          <ICON_MAP.help className="h-4 w-4" />
          {t("helpDocs")}
        </a>
      </DropdownMenu.Item>
      <DropdownMenu.Separator className={MENU_SEPARATOR_CLASS} />
      {/* A menu row rather than a nested plain button: Radix menus
          `preventDefault()` on Tab, so anything inside the content that is
          not an item is unreachable by keyboard. `preventDefault` on select
          keeps the menu open, because comparing the two themes means
          pressing this twice. */}
      <DropdownMenu.Item
        asChild
        className={MENU_ITEM_CLASS}
        onSelect={(event) => event.preventDefault()}
      >
        <ThemeToggle className="h-auto w-full justify-start" />
      </DropdownMenu.Item>
    </>
  );
}

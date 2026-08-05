import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "./header-menu-styles";
import type { HeaderAttention } from "./use-header-attention";

const CONNECTIONS_PATH = "/settings/connections";

/**
 * No amber. Amber is Z4 — a warning painted in it competes with the
 * athlete's own threshold data, so severity is carried by the icon, the
 * sentence and the panel instead.
 */
const PILL_CLASS = "border border-edge bg-surface-elevated text-ink-strong";

type SourceHealthPillProps = {
  /** `null` is the healthy state and renders nothing at all. */
  attention: HeaderAttention | null;
};

/**
 * The amber pill, and nothing at all when every source is healthy — chrome
 * that is always on screen is not a signal.
 *
 * It states the count and the consequence, then hands over to the one place
 * that can act on either. There is no "Reconnect" button here: reconnecting
 * is a per-source action that lives on the card, and a header button
 * claiming to do it would have to pick a source on the user's behalf.
 */
export function SourceHealthPill({ attention }: SourceHealthPillProps) {
  const t = useTranslate("nav");
  const [, navigate] = useLocation();

  if (attention === null) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="tertiary"
          size="sm"
          aria-label={attention.title}
          className={PILL_CLASS}
          data-testid="status-header-source-health"
        >
          <ICON_MAP.alert
            aria-hidden="true"
            className="h-3.5 w-3.5 flex-none"
          />
          <span className="hidden lg:inline">{attention.title}</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={`${MENU_CONTENT_CLASS} max-w-[20rem]`}
          data-testid="source-health-menu"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block text-sm font-semibold text-ink-strong">
              {attention.title}
            </span>
            <span className="block text-xs text-ink-muted">
              {attention.detail}
            </span>
          </DropdownMenu.Label>
          <DropdownMenu.Item
            className={MENU_ITEM_CLASS}
            onSelect={() => navigate(CONNECTIONS_PATH)}
            data-testid="source-health-view-all"
          >
            {t("alert.viewAll")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

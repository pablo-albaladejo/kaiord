import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { accountInitials } from "./account-initials";
import { AccountMenuItems } from "./AccountMenuItems";
import { MENU_CONTENT_CLASS } from "./header-menu-styles";

/* Inside the login the brand is ink, so the avatar is a neutral chip rather
   than a filled accent: the only tinted pixels in the shell are the mark's
   live core. */
const AVATAR_CLASS =
  "flex h-7 w-7 items-center justify-center rounded-full bg-edge-soft text-[11px] font-semibold text-ink-strong";

type AccountMenuProps = {
  /** Marks the Connections row. Silent when every source is healthy. */
  attention: boolean;
};

/**
 * The avatar menu: everything account-level that used to be a second nav
 * row. Athlete is deliberately NOT in here — it is a destination with FTP,
 * zones and thresholds behind it, so it keeps a named slot in the bar.
 */
export function AccountMenu({ attention }: AccountMenuProps) {
  const t = useTranslate("nav");
  const tCommon = useTranslate("common");
  const activeProfile = useActiveProfileLive()?.profile ?? null;
  const name = activeProfile?.name ?? null;
  const initials = accountInitials(name);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="tertiary"
          size="sm"
          aria-label={
            name === null ? t("aria.accountEmpty") : t("aria.account", { name })
          }
          className="rounded-full border border-edge px-1"
          data-testid="status-header-account-button"
        >
          <span aria-hidden="true" className={AVATAR_CLASS}>
            {initials === "" ? (
              <ICON_MAP.athlete className="h-4 w-4" />
            ) : (
              initials
            )}
          </span>
          <ICON_MAP.chevD className="h-3 w-3" aria-hidden="true" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={MENU_CONTENT_CLASS}
          data-testid="account-menu"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block text-sm font-semibold text-ink-strong">
              {name ?? tCommon("status.noProfile")}
            </span>
            {/* "Local account" is the whole claim. Records in this browser
                are not encrypted at rest — only sync snapshots are, before
                upload — so no line here says otherwise. */}
            <span className="block text-xs text-ink-muted">
              {t("localAccount")}
            </span>
          </DropdownMenu.Label>
          <AccountMenuItems attention={attention} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

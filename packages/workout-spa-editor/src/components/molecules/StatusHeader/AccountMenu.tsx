import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useProfilesLive } from "../../../hooks/use-profiles-live";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { accountInitials } from "./account-initials";
import { AccountMenuItems } from "./AccountMenuItems";
import { AthleteSwitcher } from "./AthleteSwitcher";
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
 * The avatar menu: the athlete switcher on top, then everything
 * account-level that used to be a second nav row. The Athlete destination
 * itself still keeps its named slot in the bar.
 */
export function AccountMenu({ attention }: AccountMenuProps) {
  const t = useTranslate("nav");
  const active = useActiveProfileLive();
  const activeProfile = active?.profile ?? null;
  const name = activeProfile?.name ?? null;
  const initials = accountInitials(name);
  const profiles = useProfilesLive();
  // Held shut while either read is in flight: opened then, the menu gained
  // its athlete rows a moment later and moved every row under the tap.
  // Natively disabled, so a test or a user is told to wait. If the database
  // never opens, every live read in the app waits with it; /settings stays
  // reachable by URL.
  const loading = active === undefined || profiles === undefined;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={loading}>
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
          <AthleteSwitcher
            profiles={profiles ?? []}
            activeId={active?.id ?? ""}
          />
          <AccountMenuItems attention={attention} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

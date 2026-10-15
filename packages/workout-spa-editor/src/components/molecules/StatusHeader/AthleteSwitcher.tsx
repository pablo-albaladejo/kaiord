import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useId } from "react";
import { useLocation } from "wouter";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useProfileSwitch } from "../../../hooks/use-profile-switch";
import { useProfilesLive } from "../../../hooks/use-profiles-live";
import { useTranslate } from "../../../i18n/use-translate";
import { ATHLETES_PATH } from "../../../routing/constants";
import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { MenuItem, MenuRadioItem } from "../../atoms/MenuItem";
import { MENU_ITEM_CLASS, MENU_SEPARATOR_CLASS } from "./header-menu-styles";

const LABEL_CLASS =
  "px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted";

/* Capped so many athletes scroll inside the menu instead of pushing it
   past a 390px-wide, short viewport. */
const LIST_CLASS = "max-h-[40vh] overflow-y-auto";

/**
 * Top of the avatar menu: every profile as a radio, the active one checked,
 * then the way to the Athletes page. Switching reuses the same use case and
 * failure toast as that page.
 */
export function AthleteSwitcher() {
  const t = useTranslate("nav");
  const labelId = useId();
  const [, navigate] = useLocation();
  const profiles = useProfilesLive() ?? [];
  const activeId = useActiveProfileLive()?.id ?? "";
  const { handleSwitchProfile } = useProfileSwitch({
    profiles,
  });

  return (
    <>
      <DropdownMenu.Label id={labelId} className={LABEL_CLASS}>
        {t("athleteSection")}
      </DropdownMenu.Label>
      <DropdownMenu.RadioGroup
        aria-labelledby={labelId}
        value={activeId}
        onValueChange={handleSwitchProfile}
        className={LIST_CLASS}
      >
        {profiles.map((profile) => (
          <MenuRadioItem
            key={profile.id}
            value={profile.id}
            className={MENU_ITEM_CLASS}
            data-testid={`account-menu-athlete-${profile.id}`}
          >
            <span className="flex h-4 w-4 flex-none items-center justify-center">
              <DropdownMenu.ItemIndicator>
                <ICON_MAP.check className="h-4 w-4" aria-hidden="true" />
              </DropdownMenu.ItemIndicator>
            </span>
            <span className="min-w-0 truncate">{profile.name}</span>
          </MenuRadioItem>
        ))}
      </DropdownMenu.RadioGroup>
      <MenuItem
        className={MENU_ITEM_CLASS}
        onSelect={() => navigate(ATHLETES_PATH)}
        data-testid="account-menu-manage-athletes"
      >
        <span className="h-4 w-4 flex-none" aria-hidden="true" />
        {t("manageAthletes")}
      </MenuItem>
      <DropdownMenu.Separator className={MENU_SEPARATOR_CLASS} />
    </>
  );
}

import { SETTINGS_SECTION_ATTR } from "../SettingsPage/settings-section";

/** Anchor id and `?section=` value of the Body card on /athlete. */
export const BODY_SECTION_ID = "body";

/** Marks the card for `useFocusOnSectionChange` (`/athlete?section=body`). */
export const BODY_SECTION_ATTRS = {
  [SETTINGS_SECTION_ATTR]: BODY_SECTION_ID,
};

export const BODY_SECTION_HREF = `/athlete?section=${BODY_SECTION_ID}`;

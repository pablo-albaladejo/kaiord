export const SETTINGS_SECTION_ATTR = "data-settings-section" as const;
export const SETTINGS_SECTION_SELECTOR = `[${SETTINGS_SECTION_ATTR}]` as const;

export type SettingsSectionId =
  | "providers"
  | "custom-instructions"
  | "data-management";

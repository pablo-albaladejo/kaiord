import type { IconName } from "../../atoms/Icon";

export type SettingsRowDef = {
  icon: IconName;
  /** Stable identity: i18n key under `settings.rows.*`, React key, and testid. */
  key: string;
  to?: string;
  detailKey?: "defaultProvider";
};

export type SettingsGroupDef = {
  /** Stable identity: i18n key under `settings.groups.*` and React key. */
  key: string;
  rows: ReadonlyArray<SettingsRowDef>;
};

export const SETTINGS_GROUPS: ReadonlyArray<SettingsGroupDef> = [
  {
    key: "aiGeneration",
    rows: [
      {
        icon: "sparkle",
        key: "provider",
        to: "/settings/ai?section=providers",
        detailKey: "defaultProvider",
      },
      {
        icon: "edit",
        key: "customInstructions",
        to: "/settings/ai?section=custom-instructions",
      },
    ],
  },
  {
    key: "crossDeviceSync",
    rows: [{ icon: "sync", key: "googleDriveSync", to: "/settings/sync" }],
  },
  {
    key: "dataRouting",
    rows: [{ icon: "route", key: "dataHub", to: "/settings/data-hub" }],
  },
  {
    key: "preferences",
    rows: [
      { icon: "target", key: "units", to: "/settings/preferences" },
      { icon: "chat", key: "language", to: "/settings/preferences" },
      { icon: "bell", key: "notifications", to: "/settings/preferences" },
    ],
  },
  {
    key: "privacyData",
    rows: [
      { icon: "shield", key: "dataPrivacy", to: "/settings/privacy" },
      {
        icon: "shield",
        key: "manageYourData",
        to: "/settings/privacy?section=data-management",
      },
    ],
  },
  {
    key: "advanced",
    rows: [
      { icon: "link", key: "extensions", to: "/settings/extensions" },
      { icon: "trend", key: "usage", to: "/settings/usage" },
    ],
  },
];

export const SETTINGS_VERSION_LABEL = "Kaiord";

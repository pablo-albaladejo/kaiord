import type { IconName } from "../../atoms/Icon";

export type SettingsRowDef = {
  icon: IconName;
  label: string;
  to?: string;
  detailKey?: "defaultProvider";
};

export type SettingsGroupDef = {
  eyebrow: string;
  rows: ReadonlyArray<SettingsRowDef>;
};

export const SETTINGS_GROUPS: ReadonlyArray<SettingsGroupDef> = [
  {
    eyebrow: "AI generation",
    rows: [
      {
        icon: "sparkle",
        label: "Provider",
        to: "/settings/ai?section=providers",
        detailKey: "defaultProvider",
      },
      {
        icon: "edit",
        label: "Custom instructions",
        to: "/settings/ai?section=custom-instructions",
      },
    ],
  },
  {
    eyebrow: "Cross-device sync",
    rows: [{ icon: "sync", label: "Google Drive sync", to: "/settings/sync" }],
  },
  {
    eyebrow: "Preferences",
    rows: [
      { icon: "target", label: "Units", to: "/settings/preferences" },
      { icon: "bell", label: "Notifications", to: "/settings/preferences" },
    ],
  },
  {
    eyebrow: "Privacy & data",
    rows: [
      { icon: "shield", label: "Data & privacy", to: "/settings/privacy" },
      {
        icon: "shield",
        label: "Manage your data",
        to: "/settings/privacy?section=data-management",
      },
    ],
  },
  {
    eyebrow: "Advanced",
    rows: [
      { icon: "link", label: "Extensions", to: "/settings/extensions" },
      { icon: "trend", label: "Usage", to: "/settings/usage" },
    ],
  },
];

export const SETTINGS_VERSION_LABEL = "Kaiord";

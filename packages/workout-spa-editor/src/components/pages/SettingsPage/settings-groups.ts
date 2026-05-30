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
        to: "/settings/ai",
        detailKey: "defaultProvider",
      },
      { icon: "edit", label: "Custom instructions", to: "/settings/ai" },
    ],
  },
  {
    eyebrow: "Preferences",
    rows: [
      { icon: "target", label: "Units" },
      { icon: "bell", label: "Notifications" },
    ],
  },
  {
    eyebrow: "Privacy & data",
    rows: [
      { icon: "shield", label: "Data & privacy", to: "/settings/privacy" },
      { icon: "upload", label: "Export everything", to: "/settings/privacy" },
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

import type { SettingsGroupDef, SettingsRowDef } from "./settings-group-types";

const DOCS_URL = "https://kaiord.com/docs/";

const YOUR_DATA_ROWS: ReadonlyArray<SettingsRowDef> = [
  {
    icon: "link",
    key: "connections",
    to: "/settings/connections",
    valueKey: "connections",
  },
  {
    icon: "sync",
    key: "googleDriveSync",
    to: "/settings/sync",
    valueKey: "sync",
  },
  {
    icon: "shield",
    key: "dataPrivacy",
    to: "/settings/privacy",
    valueKey: "privacy",
  },
  {
    icon: "shield",
    key: "manageYourData",
    to: "/settings/privacy?section=data-management",
  },
  { icon: "link", key: "extensions", to: "/settings/extensions" },
  { icon: "route", key: "dataHub", to: "/settings/data-hub" },
];

const AI_ROWS: ReadonlyArray<SettingsRowDef> = [
  {
    icon: "sparkle",
    key: "provider",
    to: "/settings/ai?section=providers",
    valueKey: "provider",
  },
  {
    icon: "edit",
    key: "customInstructions",
    to: "/settings/ai?section=custom-instructions",
  },
  { icon: "trend", key: "usage", to: "/settings/usage", valueKey: "usage" },
];

const PREFERENCES_ROWS: ReadonlyArray<SettingsRowDef> = [
  {
    icon: "target",
    key: "units",
    to: "/settings/preferences",
    valueKey: "units",
  },
  {
    icon: "chat",
    key: "language",
    to: "/settings/preferences",
    valueKey: "language",
  },
  {
    icon: "bell",
    key: "notifications",
    to: "/settings/preferences",
    valueKey: "notifications",
  },
];

const ABOUT_ROWS: ReadonlyArray<SettingsRowDef> = [
  { icon: "help", key: "helpDocs", href: DOCS_URL },
  // Replaces the retired "Replay Tutorial" button: there is no tour to
  // replay, so this re-arms the coach marks the profile already dismissed.
  { icon: "sparkle", key: "replayTips", action: "replayCoachMarks" },
];

export const SETTINGS_GROUPS: ReadonlyArray<SettingsGroupDef> = [
  { key: "yourData", rows: YOUR_DATA_ROWS },
  { key: "ai", rows: AI_ROWS },
  { key: "preferences", rows: PREFERENCES_ROWS },
  { key: "about", rows: ABOUT_ROWS },
];

export const SETTINGS_VERSION_LABEL = "Kaiord";

import type { SettingsRowDef } from "./settings-group-types";

/**
 * The index rows below the inline General section, in rail order. General
 * itself is not a row: its controls sit on the index, so changing a unit or
 * the language takes no extra click.
 */
export const SETTINGS_PAGE_ROWS: ReadonlyArray<SettingsRowDef> = [
  { icon: "sparkle", key: "ai", valueKey: "ai" },
  { icon: "sync", key: "sync", valueKey: "sync" },
  { icon: "upload", key: "data", valueKey: "data" },
  { icon: "shield", key: "privacy" },
  { icon: "info", key: "about" },
];

export const SETTINGS_VERSION_LABEL = "Kaiord";

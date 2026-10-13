import type { IconName } from "../../atoms/Icon";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";

/**
 * Identifies a live value rendered inline on a settings row. Every key is
 * resolved by `useSettingsRowValues`; a row without one renders no value.
 */
export type SettingsValueKey = "connections" | "ai" | "sync" | "data";

/** Identifies an action resolved by `useSettingsRowActions`. */
export type SettingsActionKey = "replayCoachMarks";

/**
 * One index row per section page: its key is the section id, so the row,
 * the rail entry, the route segment and the panel share one identity.
 */
export type SettingsRowDef = {
  icon: IconName;
  key: SettingsTab;
  valueKey?: SettingsValueKey;
};

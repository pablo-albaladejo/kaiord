import type { IconName } from "../../atoms/Icon";

/**
 * Identifies a live value rendered inline on a settings row. Every key is
 * resolved by `useSettingsRowValues`; a row without one renders no value.
 */
export type SettingsValueKey =
  | "provider"
  | "sync"
  | "privacy"
  | "usage"
  | "units"
  | "language"
  | "notifications";

export type SettingsRowDef = {
  icon: IconName;
  /** Stable identity: i18n key under `settings.rows.*`, React key, and testid. */
  key: string;
  /** In-app destination handed to the router. */
  to?: string;
  /** External destination opened in a new tab; mutually exclusive with `to`. */
  href?: string;
  valueKey?: SettingsValueKey;
};

export type SettingsGroupDef = {
  /** Stable identity: i18n key under `settings.groups.*` and React key. */
  key: string;
  rows: ReadonlyArray<SettingsRowDef>;
};

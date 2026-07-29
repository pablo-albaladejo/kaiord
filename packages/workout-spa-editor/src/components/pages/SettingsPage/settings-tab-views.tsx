import { ConnectionsTab } from "../../organisms/Connections/ConnectionsTab";
import { AiTab } from "../../organisms/SettingsPanel/AiTab";
import { PreferencesTab } from "../../organisms/SettingsPanel/PreferencesTab";
import { PrivacyTab } from "../../organisms/SettingsPanel/PrivacyTab";
import { SyncTab } from "../../organisms/SettingsPanel/SyncTab";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { UsageTab } from "../../organisms/SettingsPanel/UsageTab";

const TAB_ORDER: ReadonlyArray<SettingsTab> = [
  "ai",
  "sync",
  "connections",
  "usage",
  "privacy",
  "preferences",
];

const TAB_VIEWS: Record<SettingsTab, React.FC> = {
  ai: AiTab,
  sync: SyncTab,
  connections: ConnectionsTab,
  usage: UsageTab,
  privacy: PrivacyTab,
  preferences: PreferencesTab,
};

/**
 * Sections retired into Connections. Their paths were the Settings index's own
 * links, so they are in browser histories and bookmarks; they resolve to the
 * section that absorbed them rather than dropping to the index.
 *
 * A `Map`, not an object literal: the key comes straight off the URL, and an
 * object would answer for every `Object.prototype` member — `/settings/toString`
 * would resolve to a "section" and redirect to a path built from a function.
 */
const RETIRED_SECTIONS: ReadonlyMap<string, SettingsTab> = new Map([
  ["data-hub", "connections"],
  ["extensions", "connections"],
]);

export const SETTINGS_TAB_VIEWS = TAB_VIEWS;

/** Rail order. One entry per section, so a section is marked current once. */
export const SETTINGS_TAB_ORDER = TAB_ORDER;

export const DEFAULT_SETTINGS_TAB: SettingsTab = "ai";

export const isSettingsTab = (
  value: string | undefined
): value is SettingsTab =>
  value !== undefined && (TAB_ORDER as ReadonlyArray<string>).includes(value);

/** The live section a retired path folds into, `undefined` if it is not one. */
export const retiredSectionTarget = (
  value: string | undefined
): SettingsTab | undefined =>
  value === undefined ? undefined : RETIRED_SECTIONS.get(value);

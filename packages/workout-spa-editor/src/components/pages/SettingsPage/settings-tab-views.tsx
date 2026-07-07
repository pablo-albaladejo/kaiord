import { DataHubTab } from "../../organisms/DataHub/DataHubTab";
import { AiTab } from "../../organisms/SettingsPanel/AiTab";
import { ExtensionsTab } from "../../organisms/SettingsPanel/ExtensionsTab";
import { PreferencesTab } from "../../organisms/SettingsPanel/PreferencesTab";
import { PrivacyTab } from "../../organisms/SettingsPanel/PrivacyTab";
import { SyncTab } from "../../organisms/SettingsPanel/SyncTab";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { UsageTab } from "../../organisms/SettingsPanel/UsageTab";

const TAB_ORDER: ReadonlyArray<SettingsTab> = [
  "ai",
  "sync",
  "data-hub",
  "extensions",
  "usage",
  "privacy",
  "preferences",
];

const TAB_LABELS: Record<SettingsTab, string> = {
  ai: "AI",
  sync: "Sync",
  "data-hub": "Data Hub",
  extensions: "Extensions",
  usage: "Usage",
  privacy: "Privacy",
  preferences: "Preferences",
};

const TAB_VIEWS: Record<SettingsTab, React.FC> = {
  ai: AiTab,
  sync: SyncTab,
  "data-hub": DataHubTab,
  extensions: ExtensionsTab,
  usage: UsageTab,
  privacy: PrivacyTab,
  preferences: PreferencesTab,
};

export const SETTINGS_TAB_LABELS = TAB_LABELS;
export const SETTINGS_TAB_VIEWS = TAB_VIEWS;
export const DEFAULT_SETTINGS_TAB: SettingsTab = "ai";

export const isSettingsTab = (
  value: string | undefined
): value is SettingsTab =>
  value !== undefined && (TAB_ORDER as ReadonlyArray<string>).includes(value);

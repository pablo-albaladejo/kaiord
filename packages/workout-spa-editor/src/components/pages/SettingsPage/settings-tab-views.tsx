import { AiTab } from "../../organisms/SettingsPanel/AiTab";
import { ExtensionsTab } from "../../organisms/SettingsPanel/ExtensionsTab";
import { PrivacyTab } from "../../organisms/SettingsPanel/PrivacyTab";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { UsageTab } from "../../organisms/SettingsPanel/UsageTab";

const TAB_ORDER: ReadonlyArray<SettingsTab> = [
  "ai",
  "extensions",
  "usage",
  "privacy",
];

const TAB_LABELS: Record<SettingsTab, string> = {
  ai: "AI",
  extensions: "Extensions",
  usage: "Usage",
  privacy: "Privacy",
};

const TAB_VIEWS: Record<SettingsTab, React.FC> = {
  ai: AiTab,
  extensions: ExtensionsTab,
  usage: UsageTab,
  privacy: PrivacyTab,
};

export const SETTINGS_TAB_LABELS = TAB_LABELS;
export const SETTINGS_TAB_VIEWS = TAB_VIEWS;
export const DEFAULT_SETTINGS_TAB: SettingsTab = "ai";

export const isSettingsTab = (
  value: string | undefined
): value is SettingsTab =>
  value !== undefined && (TAB_ORDER as ReadonlyArray<string>).includes(value);

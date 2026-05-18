import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { SETTINGS_TAB_LABELS, SETTINGS_TABS } from "./settings-tab-views";

type SettingsPageTabsProps = {
  activeTab: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
};

const tabClass = (active: boolean) =>
  [
    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
    active
      ? "bg-primary-600 text-white"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800",
  ].join(" ");

export const SettingsPageTabs = ({
  activeTab,
  onSelect,
}: SettingsPageTabsProps) => (
  <nav
    role="tablist"
    aria-orientation="vertical"
    aria-label="Settings sections"
    className="flex w-full flex-col gap-1 sm:w-48"
  >
    {SETTINGS_TABS.map((tab) => (
      <button
        key={tab}
        type="button"
        role="tab"
        id={`settings-tab-${tab}`}
        aria-controls={`settings-panel-${tab}`}
        aria-selected={tab === activeTab}
        onClick={() => onSelect(tab)}
        className={tabClass(tab === activeTab)}
        data-testid={`settings-tab-${tab}`}
      >
        {SETTINGS_TAB_LABELS[tab]}
      </button>
    ))}
  </nav>
);

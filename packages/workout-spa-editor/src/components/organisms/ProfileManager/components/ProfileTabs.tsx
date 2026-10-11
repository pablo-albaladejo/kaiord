/**
 * ProfileTabs Component
 *
 * Top-level tab selector: Training Zones | Personal Data | Linked Accounts.
 * The former "Data Flows" tab was retired (F4.2): routing now lives
 * exclusively on the Connections page (/settings/connections).
 */

import { useTranslate } from "../../../../i18n/use-translate";

type ProfileTab = "zones" | "personal" | "linked-accounts";

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

const TABS: Array<{ id: ProfileTab; labelKey: string }> = [
  { id: "zones", labelKey: "profileManager.tabs.zones" },
  { id: "personal", labelKey: "profileManager.tabs.personal" },
  { id: "linked-accounts", labelKey: "profileManager.tabs.linkedAccounts" },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const t = useTranslate("athlete");
  return (
    <div
      role="tablist"
      className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-accent bg-surface text-accent"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}

export type { ProfileTab };

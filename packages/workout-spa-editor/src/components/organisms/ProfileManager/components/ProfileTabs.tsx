/**
 * ProfileTabs Component
 *
 * Top-level tab selector: Training Zones | Personal Data.
 */

type ProfileTab = "zones" | "personal";

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: "zones", label: "Training Zones" },
  { id: "personal", label: "Personal Data" },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
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
              ? "border-b-2 border-blue-600 bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { ProfileTab };

import type { SettingsTab } from "./types";

type TabButtonProps = {
  tab: SettingsTab;
  label: string;
  active: boolean;
  onClick: (tab: SettingsTab) => void;
};

export const TabButton: React.FC<TabButtonProps> = ({
  tab,
  label,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={() => onClick(tab)}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      active
        ? "bg-white text-blue-600 border-b-2 border-blue-600 dark:bg-gray-800 dark:text-blue-400"
        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    }`}
  >
    {label}
  </button>
);

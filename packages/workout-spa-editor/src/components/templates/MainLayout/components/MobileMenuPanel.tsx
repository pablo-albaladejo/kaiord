/**
 * MobileMenuPanel - Dropdown panel for mobile hamburger menu.
 */

import { HelpCircle, Library, Settings, User } from "lucide-react";

type MobileMenuPanelProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfile: () => void;
  onLibrary: () => void;
  onHelp: () => void;
  onSettings: () => void;
};

export function MobileMenuPanel({
  activeProfileName,
  libraryCount,
  onProfile,
  onLibrary,
  onHelp,
  onSettings,
}: MobileMenuPanelProps) {
  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <MenuItem icon={<User className="h-4 w-4" />} onClick={onProfile}>
        {activeProfileName || "Profiles"}
      </MenuItem>
      <MenuItem icon={<Library className="h-4 w-4" />} onClick={onLibrary}>
        Library ({libraryCount})
      </MenuItem>
      <MenuItem icon={<HelpCircle className="h-4 w-4" />} onClick={onHelp}>
        Help
      </MenuItem>
      <MenuItem icon={<Settings className="h-4 w-4" />} onClick={onSettings}>
        Settings
      </MenuItem>
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      {icon}
      {children}
    </button>
  );
}

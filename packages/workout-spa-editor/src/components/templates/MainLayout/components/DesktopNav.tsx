/**
 * DesktopNav - Inline nav buttons visible on sm+ screens.
 */

import { HelpCircle, Settings, User } from "lucide-react";

import { Button } from "../../../atoms/Button/Button";
import { LibraryButton } from "./LibraryButton";

type DesktopNavProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfileClick: () => void;
  onLibraryClick: () => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
};

export function DesktopNav({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onLibraryClick,
  onHelpClick,
  onSettingsClick,
}: DesktopNavProps) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Button
        variant="tertiary"
        size="sm"
        onClick={onProfileClick}
        aria-label="Open profile manager"
      >
        <User className="h-4 w-4" />
        <span>{activeProfileName || "Profiles"}</span>
      </Button>
      <LibraryButton
        libraryCount={libraryCount}
        onLibraryClick={onLibraryClick}
      />
      <Button
        variant="tertiary"
        size="sm"
        onClick={onHelpClick}
        aria-label="Open help"
        title="Help (?)"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Help</span>
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={onSettingsClick}
        aria-label="Open settings"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Button>
    </div>
  );
}

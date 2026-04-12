/**
 * HeaderNav Component
 *
 * Navigation buttons for the header.
 */

import { Calendar, HelpCircle, Settings, User } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "../../../atoms/Button/Button";
import { ThemeToggle } from "../../../atoms/ThemeToggle";
import { LibraryButton } from "./LibraryButton";

type HeaderNavProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfileClick: () => void;
  onLibraryClick: () => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
};

export function HeaderNav({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onLibraryClick,
  onHelpClick,
  onSettingsClick,
}: HeaderNavProps) {
  const [, navigate] = useLocation();

  return (
    <nav className="flex items-center gap-2" aria-label="Main navigation">
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => navigate("/calendar")}
        aria-label="Go to calendar"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Calendar</span>
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={onProfileClick}
        aria-label="Open profile manager"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">
          {activeProfileName || "Profiles"}
        </span>
      </Button>
      <LibraryButton
        libraryCount={libraryCount}
        onLibraryClick={onLibraryClick}
      />
      <Button
        variant="tertiary"
        size="sm"
        onClick={onHelpClick}
        aria-label="Open help (Press ?)"
        title="Help (?)"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Help</span>
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={onSettingsClick}
        aria-label="Open settings"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
      </Button>
      <ThemeToggle />
    </nav>
  );
}

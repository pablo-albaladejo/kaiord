/**
 * HeaderNav Component
 *
 * Navigation buttons for the header.
 */

import { HelpCircle, Library, User } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";
import { ThemeToggle } from "../../../atoms/ThemeToggle";

type HeaderNavProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfileClick: () => void;
  onLibraryClick: () => void;
  onHelpClick: () => void;
};

export function HeaderNav({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onLibraryClick,
  onHelpClick,
}: HeaderNavProps) {
  return (
    <nav className="flex items-center gap-2" aria-label="Main navigation">
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
      <Button
        variant="tertiary"
        size="sm"
        onClick={onLibraryClick}
        aria-label="Open workout library"
        className="relative"
      >
        <Library className="h-4 w-4" />
        <span className="hidden sm:inline">Library</span>
        {libraryCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white"
            aria-label={`${libraryCount} workouts in library`}
          >
            {libraryCount}
          </span>
        )}
      </Button>
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
      <ThemeToggle />
    </nav>
  );
}

/**
 * HeaderNav Component
 *
 * Desktop: all nav items visible inline.
 * Mobile: Calendar button + hamburger menu for the rest.
 */

import { Calendar, HelpCircle, Menu, Settings, User } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

import { Button } from "../../../atoms/Button/Button";
import { ThemeToggle } from "../../../atoms/ThemeToggle";
import { LibraryButton } from "./LibraryButton";
import { MobileMenuPanel } from "./MobileMenuPanel";

type HeaderNavProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfileClick: () => void;
  onLibraryClick: () => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
};

export function HeaderNav(props: HeaderNavProps) {
  const [, navigate] = useLocation();

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => navigate("/calendar")}
        aria-label="Go to calendar"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Calendar</span>
      </Button>
      <DesktopNav {...props} />
      <MobileMenu {...props} />
      <ThemeToggle />
    </nav>
  );
}

function DesktopNav({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onLibraryClick,
  onHelpClick,
  onSettingsClick,
}: HeaderNavProps) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Button variant="tertiary" size="sm" onClick={onProfileClick} aria-label="Open profile manager">
        <User className="h-4 w-4" />
        <span>{activeProfileName || "Profiles"}</span>
      </Button>
      <LibraryButton libraryCount={libraryCount} onLibraryClick={onLibraryClick} />
      <Button variant="tertiary" size="sm" onClick={onHelpClick} aria-label="Open help" title="Help (?)">
        <HelpCircle className="h-4 w-4" />
        <span>Help</span>
      </Button>
      <Button variant="tertiary" size="sm" onClick={onSettingsClick} aria-label="Open settings">
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Button>
    </div>
  );
}

function MobileMenu({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onLibraryClick,
  onHelpClick,
  onSettingsClick,
}: HeaderNavProps) {
  const [open, setOpen] = useState(false);

  const handle = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <div className="relative sm:hidden">
      <Button variant="tertiary" size="sm" onClick={() => setOpen(!open)} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <MobileMenuPanel
            activeProfileName={activeProfileName}
            libraryCount={libraryCount}
            onProfile={handle(onProfileClick)}
            onLibrary={handle(onLibraryClick)}
            onHelp={handle(onHelpClick)}
            onSettings={handle(onSettingsClick)}
          />
        </>
      )}
    </div>
  );
}

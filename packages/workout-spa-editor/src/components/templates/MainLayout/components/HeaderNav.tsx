/**
 * HeaderNav Component
 *
 * Desktop: all nav items visible inline.
 * Mobile: Calendar button + hamburger menu for the rest.
 */

import { Calendar } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "../../../atoms/Button/Button";
import { ThemeToggle } from "../../../atoms/ThemeToggle";
import { DesktopNav } from "./DesktopNav";
import { MobileMenu } from "./MobileMenu";

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
    <nav
      className="flex items-center gap-1 sm:gap-2"
      aria-label="Main navigation"
    >
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

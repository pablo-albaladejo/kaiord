/**
 * MobileMenu - Hamburger menu toggle for mobile header nav.
 *
 * The Library entry inside the panel navigates to `/library` directly
 * (via `useLocation`) rather than receiving an `onLibraryClick`
 * proxy prop — Library is a routed page per the SPA surface-
 * classification rule.
 */

import { Menu } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

import { Button } from "../../../atoms/Button/Button";
import { MobileMenuPanel } from "./MobileMenuPanel";

type MobileMenuProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfileClick: () => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
};

export function MobileMenu({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onHelpClick,
  onSettingsClick,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const handle = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  const handleLibrary = () => {
    setOpen(false);
    navigate("/library");
  };

  return (
    <div className="relative sm:hidden">
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <MobileMenuPanel
            activeProfileName={activeProfileName}
            libraryCount={libraryCount}
            onProfile={handle(onProfileClick)}
            onLibrary={handleLibrary}
            onHelp={handle(onHelpClick)}
            onSettings={handle(onSettingsClick)}
          />
        </>
      )}
    </div>
  );
}

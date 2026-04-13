/**
 * MobileMenu - Hamburger menu toggle for mobile header nav.
 */

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../atoms/Button/Button";
import { MobileMenuPanel } from "./MobileMenuPanel";

type MobileMenuProps = {
  activeProfileName: string | null;
  libraryCount: number;
  onProfileClick: () => void;
  onLibraryClick: () => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
};

export function MobileMenu({
  activeProfileName,
  libraryCount,
  onProfileClick,
  onLibraryClick,
  onHelpClick,
  onSettingsClick,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const handle = (fn: () => void) => () => {
    fn();
    setOpen(false);
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
            onLibrary={handle(onLibraryClick)}
            onHelp={handle(onHelpClick)}
            onSettings={handle(onSettingsClick)}
          />
        </>
      )}
    </div>
  );
}

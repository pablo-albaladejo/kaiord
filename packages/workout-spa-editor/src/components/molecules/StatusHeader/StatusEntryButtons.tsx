import { HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "../../atoms/Button/Button";
import { ENTRY_DEFS } from "./status-entry-defs";

type StatusEntryButtonsProps = {
  onHelpClick: () => void;
};

export function StatusEntryButtons({ onHelpClick }: StatusEntryButtonsProps) {
  const [, navigate] = useLocation();
  return (
    <>
      {ENTRY_DEFS.map((entry) => (
        <Button
          key={entry.id}
          variant={entry.variant ?? "tertiary"}
          size="sm"
          onClick={() => navigate(entry.to)}
          aria-label={entry.ariaLabel}
          data-testid={`status-header-${entry.id}-button`}
        >
          <entry.icon className="h-4 w-4" />
          <span className={entry.id === "new" ? "" : "hidden sm:inline"}>
            {entry.label}
          </span>
        </Button>
      ))}
      <Button
        variant="tertiary"
        size="sm"
        onClick={onHelpClick}
        aria-label="Open help"
        title="Help (?)"
        data-testid="status-header-help-button"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Help</span>
      </Button>
    </>
  );
}

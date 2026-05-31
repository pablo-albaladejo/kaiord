import { HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "../../atoms/Button/Button";
import { ProfileEntryButton } from "./ProfileEntryButton";
import type { EntryDef } from "./status-entry-defs";
import { ENTRY_DEFS, resolveEntryHref } from "./status-entry-defs";
import { StatusIndicators } from "./StatusIndicators";

type StatusEntryButtonsProps = {
  onHelpClick: () => void;
};

function EntryButton({
  entry,
  onClick,
}: {
  entry: EntryDef;
  onClick: () => void;
}) {
  return (
    <Button
      variant={entry.variant ?? "tertiary"}
      size="sm"
      onClick={onClick}
      aria-label={entry.ariaLabel}
      data-testid={`status-header-${entry.id}-button`}
    >
      <entry.icon className="h-4 w-4" />
      <span className={entry.id === "new" ? "" : "hidden sm:inline"}>
        {entry.label}
      </span>
    </Button>
  );
}

export function StatusEntryButtons({ onHelpClick }: StatusEntryButtonsProps) {
  const [, navigate] = useLocation();
  const primaryNav = ENTRY_DEFS.filter((e) =>
    ["calendar", "library", "trends", "new"].includes(e.id)
  );
  const settingsEntry = ENTRY_DEFS.find((e) => e.id === "settings");
  return (
    <>
      {primaryNav.map((entry) => (
        <EntryButton
          key={entry.id}
          entry={entry}
          onClick={() => navigate(resolveEntryHref(entry))}
        />
      ))}
      <span
        data-testid="status-header-divider"
        className="hidden h-6 w-px bg-gray-200 dark:bg-slate-700 sm:inline-block"
        aria-hidden="true"
      />
      <StatusIndicators />
      <ProfileEntryButton />
      {settingsEntry && (
        <EntryButton
          entry={settingsEntry}
          onClick={() => navigate(settingsEntry.to)}
        />
      )}
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

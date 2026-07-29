import { useLocation } from "wouter";

import { ProfileEntryButton } from "./ProfileEntryButton";
import { isEntryActive } from "./status-entry-active";
import { EntryButton } from "./status-entry-button";
import { ENTRY_DEFS } from "./status-entry-defs";
import { StatusIndicators } from "./StatusIndicators";

export function StatusEntryButtons() {
  const [location, navigate] = useLocation();
  // Athlete is reachable through ProfileEntryButton below, and settings
  // renders in its dedicated trailing slot — rendering either here would
  // duplicate the destination in the same bar.
  const primaryNav = ENTRY_DEFS.filter(
    (e) => e.id !== "settings" && e.id !== "athlete"
  );
  const settingsEntry = ENTRY_DEFS.find((e) => e.id === "settings");
  return (
    <>
      {primaryNav.map((entry) => (
        <EntryButton
          key={entry.id}
          entry={entry}
          active={isEntryActive(entry, location)}
          onClick={() => navigate(entry.to)}
        />
      ))}
      <span
        data-testid="status-header-divider"
        className="hidden h-6 w-px bg-gray-200 dark:bg-slate-700 md:inline-block"
        aria-hidden="true"
      />
      <StatusIndicators />
      <ProfileEntryButton />
      {settingsEntry && (
        <EntryButton
          entry={settingsEntry}
          active={isEntryActive(settingsEntry, location)}
          onClick={() => navigate(settingsEntry.to)}
        />
      )}
    </>
  );
}

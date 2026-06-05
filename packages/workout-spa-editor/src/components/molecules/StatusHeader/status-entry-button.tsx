import { Button } from "../../atoms/Button/Button";
import type { EntryDef } from "./status-entry-defs";

/** Accent treatment for the active header entry, merged through the Button
    atom's existing `className` join (the atom is left untouched). */
const ACTIVE_ENTRY_CLASS = "text-sky-500 dark:text-sky-400";

type EntryButtonProps = {
  entry: EntryDef;
  active: boolean;
  onClick: () => void;
};

export function EntryButton({ entry, active, onClick }: EntryButtonProps) {
  return (
    <Button
      variant={entry.variant ?? "tertiary"}
      size="sm"
      onClick={onClick}
      aria-label={entry.ariaLabel}
      aria-current={active ? "page" : undefined}
      className={active ? ACTIVE_ENTRY_CLASS : undefined}
      data-testid={`status-header-${entry.id}-button`}
    >
      <entry.icon className="h-4 w-4" />
      <span className={entry.id === "new" ? "" : "hidden sm:inline"}>
        {entry.label}
      </span>
    </Button>
  );
}

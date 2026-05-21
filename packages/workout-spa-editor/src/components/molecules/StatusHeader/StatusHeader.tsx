import { ThemeToggle } from "../../atoms/ThemeToggle";
import { StatusEntryButtons } from "./StatusEntryButtons";

type StatusHeaderProps = {
  onHelpClick: () => void;
};

export function StatusHeader({ onHelpClick }: StatusHeaderProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:justify-end"
      data-testid="status-header"
    >
      <StatusEntryButtons onHelpClick={onHelpClick} />
      <ThemeToggle />
    </nav>
  );
}

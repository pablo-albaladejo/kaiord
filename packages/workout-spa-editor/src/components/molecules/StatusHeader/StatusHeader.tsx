import { ThemeToggle } from "../../atoms/ThemeToggle";
import { StatusEntryButtons } from "./StatusEntryButtons";
import { StatusIndicators } from "./StatusIndicators";

type StatusHeaderProps = {
  onHelpClick: () => void;
};

export function StatusHeader({ onHelpClick }: StatusHeaderProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap items-center gap-3 text-sm"
      data-testid="status-header"
    >
      <StatusIndicators />
      <StatusEntryButtons onHelpClick={onHelpClick} />
      <ThemeToggle />
    </nav>
  );
}

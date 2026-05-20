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
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:justify-end"
      data-testid="status-header"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusIndicators />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
        <StatusEntryButtons onHelpClick={onHelpClick} />
        <ThemeToggle />
      </div>
    </nav>
  );
}

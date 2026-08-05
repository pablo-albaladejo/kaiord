import { getDayLabel } from "./day-label";

export type DayColumnAddButtonProps = {
  date: string;
  onAddClick: (date: string) => void;
};

export function DayColumnAddButton({
  date,
  onAddClick,
}: DayColumnAddButtonProps) {
  const label = getDayLabel(date);
  return (
    <button
      type="button"
      data-testid={`empty-day-${date}`}
      aria-label={`Add to ${label.name} ${label.num}`}
      className="mt-1 flex-1 rounded-lg border border-dashed border-edge text-xs text-ink-muted motion-safe:transition-colors hover:border-edge-strong hover:text-ink-strong"
      onClick={() => onAddClick(date)}
    >
      + Add
    </button>
  );
}

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
      className="mt-1 flex-1 rounded border border-dashed border-gray-300 text-xs text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-gray-600"
      onClick={() => onAddClick(date)}
    >
      + Add
    </button>
  );
}

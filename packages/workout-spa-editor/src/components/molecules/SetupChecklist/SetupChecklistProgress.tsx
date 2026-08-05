export type SetupChecklistProgressProps = {
  done: number;
  total: number;
  label: string;
};

/**
 * Thin progress rail for the setup checklist. `aria-valuenow` counts items,
 * not percent, so a screen reader announces "2 of 4" the same way the caption
 * does; the width is the only place percent is used.
 */
export function SetupChecklistProgress({
  done,
  total,
  label,
}: SetupChecklistProgressProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      data-testid="setup-checklist-progress"
      className="bg-surface-elevated mt-3 h-1.5 w-full overflow-hidden rounded-full"
    >
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

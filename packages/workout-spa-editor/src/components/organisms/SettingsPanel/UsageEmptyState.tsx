/**
 * UsageTab empty state — shown when no UsageRecord rows fall inside
 * the month-window.
 */

export type UsageEmptyStateProps = {
  monthsWindow: number;
};

export function UsageEmptyState({ monthsWindow }: UsageEmptyStateProps) {
  return (
    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        AI Usage
      </h3>
      <p>
        No AI usage recorded yet for the last {monthsWindow} months. The panel
        will populate automatically after your first batch run.
      </p>
    </div>
  );
}

/**
 * CalendarSkeleton - Loading placeholder for calendar week view.
 *
 * Shows 7 day columns with animated gray blocks.
 */

function SkeletonColumn({ index }: { index: number }) {
  return (
    <div
      data-testid={`skeleton-column-${index}`}
      className="flex min-h-[120px] flex-col rounded-lg border p-2"
    >
      <div className="mb-2 h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div data-testid="calendar-skeleton" className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }, (_, i) => (
        <SkeletonColumn key={i} index={i} />
      ))}
    </div>
  );
}

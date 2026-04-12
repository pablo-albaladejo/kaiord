/**
 * RouteSpinner - Loading fallback for lazy-loaded routes.
 */
export function RouteSpinner() {
  return (
    <div
      className="flex items-center justify-center p-12"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

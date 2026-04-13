/**
 * Editor Loading / No-Data States
 *
 * Early-return UI for loading and no-KRD scenarios.
 */

export function EditorLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      Loading workout...
    </div>
  );
}

export function EditorNoData() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">
        This workout has no structured data yet.
      </p>
      <a href="/calendar" className="text-primary underline mt-2">
        Go to Calendar
      </a>
    </div>
  );
}

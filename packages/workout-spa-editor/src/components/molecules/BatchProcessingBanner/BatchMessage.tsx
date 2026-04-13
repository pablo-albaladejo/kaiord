export function BatchMessage({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="text-xs underline">
        Dismiss
      </button>
    </div>
  );
}

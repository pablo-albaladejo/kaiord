/**
 * ProfileNotifications Component
 *
 * Displays error and success notifications for profile operations.
 */

type ProfileNotificationsProps = {
  importError: string | null;
  switchNotification: string | null;
};

export function ProfileNotifications({
  importError,
  switchNotification,
}: ProfileNotificationsProps) {
  return (
    <>
      {importError && (
        <div className="mb-4 rounded-md bg-danger-bg p-3 text-sm text-danger-text">
          {importError}
        </div>
      )}

      {switchNotification && (
        <div
          className="mb-4 rounded-md border border-edge bg-surface-elevated p-3 text-sm text-ink-body"
          role="status"
          aria-live="polite"
        >
          {switchNotification}
        </div>
      )}
    </>
  );
}

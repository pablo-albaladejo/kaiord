/**
 * CoachingSyncButton — Sync/Connect button for coaching platforms.
 *
 * Platform-specific logic is injected via props, not imported.
 * The calendar page wires this to the appropriate store.
 */

export type CoachingSyncButtonProps = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  onSync: () => void;
  onConnect: () => void;
  label?: string;
};

export function CoachingSyncButton({
  connected,
  loading,
  error,
  onSync,
  onConnect,
  label = "Coach",
}: CoachingSyncButtonProps) {
  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConnect}
          className="rounded border border-rose-300 bg-rose-50 px-3 py-1 text-sm text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
        >
          Connect to {label}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onSync}
      className="rounded border border-rose-300 bg-rose-50 px-3 py-1 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
    >
      {loading ? "Syncing..." : `Sync ${label}`}
    </button>
  );
}

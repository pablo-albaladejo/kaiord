/**
 * CoachingSyncButton — Sync/Connect button for coaching platforms.
 *
 * Connected state: 32×32 icon-only button with a relative-time tooltip
 * ("<Label> · 5m ago", "<Label> · syncing…", "<Label> · never synced").
 * The spinner replaces the icon in place during sync; under
 * `prefers-reduced-motion: reduce` the spinner becomes a static glyph.
 *
 * Not-connected state retains the textual "Connect to <Label>" CTA per
 * archived design D7 (low-frequency action, deserves discoverability).
 *
 * Color tokens are slate-based so the button does not compete with the
 * status-color palette of the redesigned card stack. Tooltip composition
 * + reduced-motion subscription live in coaching-sync-button-tooltip.ts.
 */

import { Loader2, RefreshCw } from "lucide-react";

import {
  buildSyncTooltip,
  usePrefersReducedMotion,
} from "./coaching-sync-button-tooltip";

export type CoachingSyncButtonProps = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  onSync: () => void;
  onConnect: () => void;
  label?: string;
  /** ISO timestamp of the last successful sync; undefined when never synced. */
  lastSyncedAt?: string | undefined;
};

const ConnectedIconButton: React.FC<{
  loading: boolean;
  reducedMotion: boolean;
  ariaLabel: string;
  title: string;
  onSync: () => void;
}> = ({ loading, reducedMotion, ariaLabel, title, onSync }) => (
  <button
    type="button"
    disabled={loading}
    onClick={onSync}
    aria-label={ariaLabel}
    title={title}
    className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
  >
    {loading ? (
      <Loader2
        className={reducedMotion ? "h-4 w-4" : "h-4 w-4 animate-spin"}
        aria-hidden="true"
      />
    ) : (
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
    )}
  </button>
);

export function CoachingSyncButton({
  connected,
  loading,
  error,
  onSync,
  onConnect,
  label = "Coach",
  lastSyncedAt,
}: CoachingSyncButtonProps) {
  const reducedMotion = usePrefersReducedMotion();

  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConnect}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Connect to {label}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  return (
    <ConnectedIconButton
      loading={loading}
      reducedMotion={reducedMotion}
      ariaLabel={`Sync ${label}`}
      title={buildSyncTooltip(label, loading, lastSyncedAt)}
      onSync={onSync}
    />
  );
}

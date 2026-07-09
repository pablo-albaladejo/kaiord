/**
 * CoachingSyncButton — Sync/Connect button for coaching platforms.
 *
 * Connected state: 32×32 icon-only button with a relative-time tooltip
 * ("<Label> · 5m ago", "<Label> · syncing…", "<Label> · never synced",
 * "<Label> · route inactive"). The spinner replaces the icon in place during
 * sync; under `prefers-reduced-motion: reduce` it becomes a static glyph.
 *
 * Not-connected state retains the textual "Connect to <Label>" CTA per
 * archived design D7 (low-frequency action, deserves discoverability).
 *
 * When the import route is off (`routeInactive`, F1.3) the connected button
 * shows an amber "route inactive" treatment so a disabled sync is never silent.
 * Tooltip composition + reduced-motion subscription live in
 * coaching-sync-button-tooltip.ts; the icon button chrome in
 * CoachingSyncIconButton.tsx.
 */

import { useTranslate } from "../../../i18n/use-translate";
import {
  buildSyncTooltip,
  usePrefersReducedMotion,
} from "./coaching-sync-button-tooltip";
import { CoachingSyncIconButton } from "./CoachingSyncIconButton";

export type CoachingSyncButtonProps = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  onSync: () => void;
  onConnect: () => void;
  label?: string;
  /** ISO timestamp of the last successful sync; undefined when never synced. */
  lastSyncedAt?: string | undefined;
  /** When true, the import route is off — sync no-ops; show "route inactive". */
  routeInactive?: boolean;
};

export function CoachingSyncButton({
  connected,
  loading,
  error,
  onSync,
  onConnect,
  label = "Coach",
  lastSyncedAt,
  routeInactive = false,
}: CoachingSyncButtonProps) {
  const t = useTranslate("coaching");
  const reducedMotion = usePrefersReducedMotion();

  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConnect}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t("sync.connectTo", { label })}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  const title = routeInactive
    ? `${label} · route inactive`
    : buildSyncTooltip(label, loading, lastSyncedAt);
  return (
    <CoachingSyncIconButton
      loading={loading}
      reducedMotion={reducedMotion}
      ariaLabel={routeInactive ? `${label} — route inactive` : `Sync ${label}`}
      title={title}
      routeInactive={routeInactive}
      onSync={onSync}
    />
  );
}

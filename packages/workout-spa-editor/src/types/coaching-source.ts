/**
 * CoachingSource — Port interface for external coaching platforms.
 *
 * Each platform (Train2Go, TrainingPeaks, etc.) implements this port via
 * a `CoachingSourceFactory` — a React hook called by useCoachingActivities
 * with the current (activeProfileId, days). The factory pattern keeps
 * useLiveQuery at the top level of a hook (rules-of-hooks compliant) and
 * lets calendar components consume only this interface.
 *
 * `sync` / `expand` / `connect` take `profileId` explicitly (captured at
 * user-action time by the caller). The use cases never fall back to
 * `getActiveId()` — see design D3 for the profile-switch race rationale.
 */

import type { CoachingActivity } from "./coaching-activity";
import type { ExpandDayResult } from "./coaching-expand-result";

export type CoachingSource = {
  id: string;
  label: string;
  badge: string;
  available: boolean;
  connected: boolean;
  /**
   * Whether an enabled import route governs this source (F1.3). `false` means
   * the route is turned off — sync is a no-op and the UI shows "route inactive".
   * `undefined` for sources with no route concept (treated as active).
   */
  routeActive?: boolean;
  loading: boolean;
  error: string | null;
  /** Activities for the supplied (profileId, days), live-queried. */
  activities: CoachingActivity[];
  /**
   * ISO timestamp of the last successful sync for the active profile.
   * `undefined` when the platform has never been synced for this profile
   * (drives the "never synced" tooltip on `CoachingSyncButton`).
   */
  lastSyncedAt: string | undefined;
  sync: (profileId: string, weekStart: string) => Promise<void>;
  /**
   * Lazily fetch a day's descriptions + comment thread. Returns the
   * `ExpandDayResult` so the dialog can surface a retryable failure state
   * instead of hanging on "Loading description…" forever.
   */
  expand: (profileId: string, date: string) => Promise<ExpandDayResult>;
  connect: (profileId: string) => Promise<void>;
};

/**
 * A coaching source factory is a React hook. The registry holds factories
 * (not pre-baked sources) so each call site can provide the current
 * (activeProfileId, days) while keeping useLiveQuery at hook top-level.
 */
export type CoachingSourceFactory = (
  activeProfileId: string | null,
  days: string[]
) => CoachingSource;

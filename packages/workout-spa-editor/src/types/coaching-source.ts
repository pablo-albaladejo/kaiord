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

export type CoachingSource = {
  id: string;
  label: string;
  badge: string;
  available: boolean;
  connected: boolean;
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
  expand: (profileId: string, date: string) => Promise<void>;
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

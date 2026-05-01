/**
 * AutoMatchDismissalRepository port — records that the user dismissed the
 * auto-match suggestion banner for a `(profileId, weekStart)` pair. The
 * 24h expiry is interpreted in the use case via `DISMISSAL_TTL_MS`; this
 * repository is value-storage only.
 */

import type { AutoMatchDismissal } from "../types/auto-match-dismissal";

export type AutoMatchDismissalRepository = {
  getByProfileAndWeek: (
    profileId: string,
    weekStart: string
  ) => Promise<AutoMatchDismissal | undefined>;
  put: (dismissal: AutoMatchDismissal) => Promise<void>;
  /** No-op when the row does not exist. */
  delete: (profileId: string, weekStart: string) => Promise<void>;
  /** Cascade hook on profile delete. */
  deleteByProfile: (profileId: string) => Promise<void>;
};

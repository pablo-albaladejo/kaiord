/**
 * pruneTombstones — drop tombstones older than the retention window.
 *
 * Tombstones grow unbounded otherwise. They are safe to drop long after
 * every active device has observed the delete; the 90-day window is well
 * past any realistic device-reconnect interval. Pure: no I/O.
 */

import type { Tombstone } from "../../types/snapshot";

/** Retention window for tombstones (90 days), in milliseconds. */
export const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/** Keep only tombstones whose `deletedAt` is within the window of `now`. */
export function pruneTombstones(
  tombstones: ReadonlyArray<Tombstone>,
  now: Date = new Date()
): Tombstone[] {
  const cutoff = now.getTime() - TOMBSTONE_RETENTION_MS;
  return tombstones.filter((t) => {
    const ms = Date.parse(t.deletedAt);
    return Number.isNaN(ms) || ms >= cutoff;
  });
}

/**
 * Throttle for the manual "Refresh all", for the whole browsing session.
 *
 * `refresh({ force: true })` bypasses BOTH of the store's own guards: the
 * 30-second positive cache (explicitly, that is what `force` means) and the
 * 60-second visibility floor, which lives in the visibility handler and not in
 * the store. Probes also run outside `BRIDGE_QUEUE`, so nothing downstream
 * provides backpressure either — a held button would message four extensions
 * as fast as they answer.
 *
 * The window matches the visibility floor rather than the positive cache: both
 * trigger the same forced whole-bridge pass, so pressing the button can never
 * be more aggressive than switching tabs already is.
 *
 * Module-scoped rather than hook state, and in-memory only: it protects
 * extensions, so it must outlive the component that renders the button, and it
 * is transient rate-limiting state that never belongs on disk.
 */
export const REFRESH_COOLDOWN_MS = 60_000;

let lastRefreshAt: number | null = null;
let inFlight: Promise<void> | null = null;

export const isRefreshCoolingDown = (now: number): boolean =>
  refreshCooldownRemaining(now) > 0;

/** How long until a press would be accepted again; 0 once it would be. */
export const refreshCooldownRemaining = (now: number): number =>
  lastRefreshAt === null
    ? 0
    : Math.max(lastRefreshAt + REFRESH_COOLDOWN_MS - now, 0);

export const isRefreshRunning = (): boolean => inFlight !== null;

/**
 * Joins the pass already in flight rather than launching a second one, so a
 * remounted button adopts the running state and settles with the pass it did
 * not start. The cooldown is stamped on settle, including on failure, so a
 * failing pass cannot be retried in a tight loop.
 */
export const startOrJoinRefresh = (
  start: () => Promise<void>,
  now: () => number = Date.now
): Promise<void> => {
  if (inFlight !== null) return inFlight;
  const settle = () => {
    inFlight = null;
    lastRefreshAt = now();
  };
  const pending = start().then(settle, (error: unknown) => {
    settle();
    throw error;
  });
  inFlight = pending;
  return pending;
};

/** Test seam: module state, so a suite must be able to clear it. */
export const resetRefreshCooldown = (): void => {
  lastRefreshAt = null;
  inFlight = null;
};

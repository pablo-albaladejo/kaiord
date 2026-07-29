/**
 * Per-bridge import throttling for the whole browsing session.
 *
 * Module-scoped rather than held in the calling component: the guards protect
 * an extension, so they must outlive the card that happens to render the
 * button. Hook state is destroyed when the Manage panel collapses, which is
 * one click away from no protection at all — and the cooldown alone does not
 * cover it, because it is only stamped once a pull settles.
 *
 * In-memory only — transient rate-limiting state, never a second copy of the
 * truth on disk (see the bridge persistence boundary).
 */
export const IMPORT_COOLDOWN_MS = 60_000;

const lastImportAt = new Map<string, number>();
const inFlight = new Map<string, Promise<void>>();

export const isCoolingDown = (bridgeId: string, now: number): boolean => {
  const last = lastImportAt.get(bridgeId);
  return last !== undefined && now - last < IMPORT_COOLDOWN_MS;
};

export const isImportRunning = (bridgeId: string): boolean =>
  inFlight.has(bridgeId);

/**
 * Runs `start` unless this bridge already has a pull in flight, in which case
 * the caller JOINS that promise instead of launching a second one. Joining
 * rather than refusing is what lets a card remounted mid-pull show the running
 * state and settle with the pull it did not start.
 *
 * The cooldown is stamped on settle — including on failure, so a bridge that
 * is erroring cannot be retried in a tight loop.
 */
export const startOrJoinImport = (
  bridgeId: string,
  start: () => Promise<void>,
  now: () => number = Date.now
): Promise<void> => {
  const existing = inFlight.get(bridgeId);
  if (existing !== undefined) return existing;
  const settle = () => {
    inFlight.delete(bridgeId);
    lastImportAt.set(bridgeId, now());
  };
  const pending = start().then(settle, (error: unknown) => {
    settle();
    throw error;
  });
  inFlight.set(bridgeId, pending);
  return pending;
};

/** Test seam: the maps are module state, so a suite must be able to clear them. */
export const resetImportCooldowns = (): void => {
  lastImportAt.clear();
  inFlight.clear();
};

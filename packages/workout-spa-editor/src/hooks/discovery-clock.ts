/**
 * When bridge discovery started listening, for the whole app boot.
 *
 * Discovery is not a request/response: nothing asks the extensions anything.
 * They announce themselves when their content script injects, and discovery
 * only broadcasts a DISCOVER request after `DISCOVER_REQUEST_DELAY_MS` if it
 * has heard nothing at all. So "have we asked?" is not a question the product
 * can answer, and a surface counting detected bridges needs to know instead
 * how long discovery has been listening.
 *
 * Module-scoped, in-memory, and stamped once: the reference point is the app
 * boot, not the mount of whichever surface reads it. A per-mount clock would
 * restart the grace window every time the reader opened the page, long after
 * the answer had settled.
 *
 * `loadedAt` is the floor because React runs child effects before parent ones:
 * a cold boot straight onto a surface that reads this can render before the
 * bootstrap effect at the root has stamped anything. This module is imported
 * by that bootstrap, so its load is the same boot — and reporting a reference
 * slightly EARLIER than discovery started can only delay the gate, never open
 * it before discovery has had its window.
 */
const loadedAt = Date.now();

let startedAt: number | null = null;

export const markDiscoveryStarted = (at: number = Date.now()): void => {
  if (startedAt === null) startedAt = at;
};

export const discoveryStartedAt = (): number => startedAt ?? loadedAt;

/** Test seam: module state, so a suite must be able to place it in time. */
export const resetDiscoveryClock = (at: number | null = null): void => {
  startedAt = at;
};

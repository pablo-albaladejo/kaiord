/**
 * Refresh triggers for the connection store: the poll interval, the
 * discovery subscription, and the visibility handler.
 *
 * The visibility path carries a 60-second floor of its own. The 30-second
 * positive cache does not cover it — a negative bridge is never cached, so
 * without the floor an alt-tab burst would re-probe every not-connected
 * bridge on every switch.
 */

const POLL_INTERVAL_MS = 300_000;
const VISIBILITY_REFRESH_MIN_INTERVAL_MS = 60_000;

export type LifecycleDeps = {
  refresh: (opts?: { force?: boolean }) => Promise<void>;
  subscribeDiscovery: (listener: () => void) => () => void;
  lastRefreshAt: () => number | null;
  now: () => number;
};

export type Lifecycle = { start: () => void; stop: () => void };

export const createLifecycle = (deps: LifecycleDeps): Lifecycle => {
  let timer: ReturnType<typeof setInterval> | null = null;
  let unsubscribeDiscovery: (() => void) | null = null;
  let onVisibility: (() => void) | null = null;

  const floorHit = (): boolean => {
    const last = deps.lastRefreshAt();
    return (
      last !== null && deps.now() - last < VISIBILITY_REFRESH_MIN_INTERVAL_MS
    );
  };

  const start = (): void => {
    if (timer !== null) return;
    unsubscribeDiscovery = deps.subscribeDiscovery(() => void deps.refresh());
    onVisibility = () => {
      if (document.visibilityState !== "visible" || floorHit()) return;
      void deps.refresh({ force: true });
    };
    document.addEventListener("visibilitychange", onVisibility);
    timer = setInterval(() => void deps.refresh(), POLL_INTERVAL_MS);
    void deps.refresh();
  };

  const stop = (): void => {
    if (timer !== null) clearInterval(timer);
    unsubscribeDiscovery?.();
    if (onVisibility) {
      document.removeEventListener("visibilitychange", onVisibility);
    }
    timer = null;
    unsubscribeDiscovery = null;
    onVisibility = null;
  };

  return { start, stop };
};

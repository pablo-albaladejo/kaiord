import { useEffect, useRef } from "react";

import type { SyncEngine } from "./sync-engine-types";

/** A quick tab switch does not need another pull. */
export const RESUME_MIN_GAP_MS = 30_000;
/** While the app stays open, changes from other devices arrive this often. */
export const VISIBLE_POLL_MS = 5 * 60_000;

/**
 * Sync used to pull only once, when the app opened. A phone PWA is resumed
 * far more often than it is opened, so it kept showing what it had loaded
 * hours earlier. This pulls again when the app becomes visible, regains
 * focus or comes back online, and every few minutes while it is visible.
 */
export function useSyncOnResume(
  engine: SyncEngine,
  now: () => number = Date.now
): void {
  const { connected, status, syncNow } = engine;
  const last = useRef(now());
  const busy = status === "syncing" || status === "needsAuth";

  useEffect(() => {
    if (!connected || busy) return;
    const pull = (minGap: number) => {
      if (document.visibilityState !== "visible") return;
      if (now() - last.current < minGap) return;
      last.current = now();
      void syncNow();
    };
    const onResume = () => pull(RESUME_MIN_GAP_MS);
    const poll = setInterval(() => pull(VISIBLE_POLL_MS), VISIBLE_POLL_MS);
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    window.addEventListener("online", onResume);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("online", onResume);
    };
  }, [connected, busy, syncNow, now]);
}

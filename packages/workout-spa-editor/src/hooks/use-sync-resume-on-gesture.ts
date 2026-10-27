import { useEffect, useRef } from "react";

import type { SyncEngine } from "./sync-engine-types";

const GESTURES = ["click", "keydown"] as const;

/**
 * A reopened app holds no Google token, and the sign-in popup only opens
 * from a user gesture. While sync waits on that (`needsAuth`), the next
 * click or key press signs in and syncs. A successful resume re-arms it for
 * the next expiry; a refused or failed sign-in does not, so it does not pop
 * up on every tap for the rest of the session.
 */
export function useSyncResumeOnGesture(engine: SyncEngine): void {
  const { status, connected, connect, syncNow } = engine;
  const used = useRef(false);

  useEffect(() => {
    if (used.current || !connected || status !== "needsAuth") return;
    const resume = () => {
      remove();
      used.current = true;
      connect()
        .then(() => {
          used.current = false;
          return syncNow();
        })
        .catch(() => undefined);
    };
    const remove = () => {
      for (const type of GESTURES)
        window.removeEventListener(type, resume, true);
    };
    for (const type of GESTURES) window.addEventListener(type, resume, true);
    return remove;
  }, [status, connected, connect, syncNow]);
}

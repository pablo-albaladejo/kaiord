import { useEffect, useRef } from "react";

import type { SyncEngine } from "./sync-engine-types";

const GESTURES = ["click", "keydown"] as const;
/** Marks a control whose press must not sign in (Disconnect). */
const NO_SYNC_RESUME_ATTR = "data-no-sync-resume";

const optedOut = (event: Event) =>
  event.target instanceof Element &&
  event.target.closest(`[${NO_SYNC_RESUME_ATTR}]`) !== null;

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
    // Leaving needsAuth (a sync now worked) re-arms the next expiry.
    if (status !== "needsAuth") used.current = false;
    if (used.current || !connected || status !== "needsAuth") return;
    const resume = (event: Event) => {
      if (optedOut(event)) return;
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

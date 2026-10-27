/**
 * Whether the user connected cross-device sync on this device. The Google
 * token lives only in memory, so without this marker a reopened tab or PWA
 * forgot it was ever connected and never synced again. Only the choice is
 * stored here, never a token.
 */

const CONNECTED_KEY = "kaiord-sync-connected";

export function isSyncConnected(): boolean {
  try {
    return localStorage.getItem(CONNECTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSyncConnected(connected: boolean): void {
  try {
    if (connected) localStorage.setItem(CONNECTED_KEY, "true");
    else localStorage.removeItem(CONNECTED_KEY);
  } catch {
    // Storage unavailable (private mode): the choice lasts this session.
  }
}

/**
 * Stable per-device identifier for cross-device sync manifests.
 *
 * Persisted in localStorage so a device keeps the same id across reloads.
 * It is a non-secret, non-PII random uuid used only to label snapshots in
 * the user's own Drive (helps a user tell which device wrote last).
 */

const DEVICE_ID_KEY = "kaiord-sync-device-id";

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    // Storage unavailable (private mode / SSR): fall back to an ephemeral id.
    return crypto.randomUUID();
  }
}

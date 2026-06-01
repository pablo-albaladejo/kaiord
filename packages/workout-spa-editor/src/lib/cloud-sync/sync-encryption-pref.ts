/**
 * Cross-device sync encryption preferences (local, non-secret).
 *
 * Persists two small UI flags in localStorage, mirroring `device-id.ts`:
 *   - whether end-to-end encryption is enabled (off by default), and
 *   - whether the one-time "AI keys upload in cleartext" warning has been
 *     shown.
 * The passphrase itself is deliberately NEVER persisted — it lives only
 * in memory for the session, so a forgotten passphrase means the cloud
 * blob is unrecoverable (documented, accepted).
 */

const ENABLED_KEY = "kaiord-sync-encryption-enabled";
const WARNING_SEEN_KEY = "kaiord-sync-plaintext-warning-seen";

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // Storage unavailable (private mode / SSR): preference is ephemeral.
  }
}

export function isEncryptionEnabled(): boolean {
  return readFlag(ENABLED_KEY);
}

export function setEncryptionEnabled(enabled: boolean): void {
  writeFlag(ENABLED_KEY, enabled);
}

export function wasPlaintextWarningSeen(): boolean {
  return readFlag(WARNING_SEEN_KEY);
}

export function markPlaintextWarningSeen(): void {
  writeFlag(WARNING_SEEN_KEY, true);
}

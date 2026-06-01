/**
 * In-memory sync passphrase holder.
 *
 * The end-to-end encryption passphrase is intentionally never persisted
 * (see `sync-encryption-pref.ts`): it lives only in this module-level
 * variable for the lifetime of the page. The encrypting CloudSyncPort
 * decorator reads it via `getSyncPassphrase`; Settings UI writes it via
 * `setSyncPassphrase`. Cleared on disconnect or page reload.
 */

let passphrase: string | null = null;

export function getSyncPassphrase(): string | null {
  return passphrase;
}

export function setSyncPassphrase(value: string): void {
  passphrase = value;
}

export function clearSyncPassphrase(): void {
  passphrase = null;
}

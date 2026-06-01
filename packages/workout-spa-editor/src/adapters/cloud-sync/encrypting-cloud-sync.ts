/**
 * Encrypting CloudSyncPort decorator.
 *
 * Wraps any `CloudSyncPort` to transparently apply optional end-to-end
 * encryption at the cloud boundary, keeping both the underlying adapter
 * (pure I/O) and the `syncWithCloud` merge engine (pure, cleartext-only)
 * unaware of crypto:
 *   - push: when encryption is enabled, the snapshot is encrypted before
 *     handing it to the inner port; otherwise it is forwarded unchanged.
 *   - pull: when the remote manifest is marked `encrypted`, the blob is
 *     decrypted with the user passphrase before returning; a cleartext
 *     remote passes through untouched. A missing passphrase blocks the
 *     pull (the receiving device must prompt first).
 */

import {
  decryptSnapshot,
  encryptSnapshot,
} from "../../lib/cloud-sync/snapshot-cipher";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type {
  EncryptedSnapshot,
  RemoteSnapshot,
  Snapshot,
  WireSnapshot,
} from "../../types/snapshot";
import { isEncryptedSnapshot } from "../../types/snapshot";

export type EncryptionSettings = {
  /** True when the user has enabled end-to-end encryption. */
  isEnabled: () => boolean;
  /** The current passphrase, or null when none has been entered. */
  getPassphrase: () => string | null;
};

const MISSING_PASSPHRASE =
  "Encrypted snapshot requires a passphrase before it can be applied";

export function withEncryption(
  inner: CloudSyncPort,
  settings: EncryptionSettings
): CloudSyncPort {
  const pull = async (): Promise<RemoteSnapshot | null> => {
    const remote = await inner.pull();
    if (!remote) return null;
    const wire = remote.snapshot as unknown as WireSnapshot;
    if (!isEncryptedSnapshot(wire)) return remote;
    const passphrase = settings.getPassphrase();
    if (!passphrase) throw new Error(MISSING_PASSPHRASE);
    const snapshot = await decryptSnapshot(wire, passphrase);
    return { snapshot, headRevisionId: remote.headRevisionId };
  };

  const push = async (
    snapshot: Snapshot,
    expectedRevision: string | null
  ): Promise<string> => {
    const wire = await toWire(snapshot, settings);
    return inner.push(wire as unknown as Snapshot, expectedRevision);
  };

  return {
    isAuthenticated: inner.isAuthenticated,
    authenticate: inner.authenticate,
    pull,
    push,
  };
}

async function toWire(
  snapshot: Snapshot,
  settings: EncryptionSettings
): Promise<Snapshot | EncryptedSnapshot> {
  if (!settings.isEnabled()) return snapshot;
  const passphrase = settings.getPassphrase();
  if (!passphrase) throw new Error(MISSING_PASSPHRASE);
  return encryptSnapshot(snapshot, passphrase);
}

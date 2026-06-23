/**
 * Snapshot end-to-end encryption (pure).
 *
 * Encrypts a full `Snapshot`'s `tables`+`tombstones` into a single
 * `ciphertext` blob with a user passphrase (PBKDF2 → AES-256-GCM via the
 * shared `crypto.ts` primitives), leaving the manifest in cleartext with
 * `encrypted: true` so a receiving device can detect it before prompting.
 * The cleartext manifest is bound to the ciphertext as AES-GCM Additional
 * Authenticated Data (AAD), so tampering with any manifest field makes
 * decryption fail (it stays readable but is no longer forgeable).
 * No I/O, no Drive, no Dexie — only the snapshot value and the passphrase.
 */

import type {
  EncryptedSnapshot,
  Snapshot,
  SnapshotManifest,
} from "../../types/snapshot";
import { decrypt, encrypt } from "../crypto";

type Payload = {
  tables: Snapshot["tables"];
  tombstones: Snapshot["tombstones"];
};

/**
 * Canonical, order-stable serialization of the manifest used as AES-GCM
 * AAD. An array (not an object) avoids JSON key-order ambiguity between
 * encrypt and decrypt. `encrypted` is always `true` on the wire here.
 */
function manifestAad(manifest: SnapshotManifest): string {
  return JSON.stringify([
    manifest.schemaVersion,
    manifest.deviceId,
    manifest.exportedAt,
    manifest.encrypted,
  ]);
}

export async function encryptSnapshot(
  snapshot: Snapshot,
  passphrase: string
): Promise<EncryptedSnapshot> {
  const payload: Payload = {
    tables: snapshot.tables,
    tombstones: snapshot.tombstones,
  };
  const manifest: SnapshotManifest = { ...snapshot.manifest, encrypted: true };
  const ciphertext = await encrypt(
    JSON.stringify(payload),
    passphrase,
    manifestAad(manifest)
  );
  return { manifest, ciphertext };
}

export async function decryptSnapshot(
  encrypted: EncryptedSnapshot,
  passphrase: string
): Promise<Snapshot> {
  const plaintext = await decrypt(
    encrypted.ciphertext,
    passphrase,
    manifestAad(encrypted.manifest)
  );
  const payload = JSON.parse(plaintext) as Payload;
  return {
    manifest: { ...encrypted.manifest, encrypted: false },
    tables: payload.tables,
    tombstones: payload.tombstones,
  };
}

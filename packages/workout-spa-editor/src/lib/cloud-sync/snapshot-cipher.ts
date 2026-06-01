/**
 * Snapshot end-to-end encryption (pure).
 *
 * Encrypts a full `Snapshot`'s `tables`+`tombstones` into a single
 * `ciphertext` blob with a user passphrase (PBKDF2 → AES-256-GCM via the
 * shared `crypto.ts` primitives), leaving the manifest in cleartext with
 * `encrypted: true` so a receiving device can detect it before prompting.
 * No I/O, no Drive, no Dexie — only the snapshot value and the passphrase.
 */

import type { EncryptedSnapshot, Snapshot } from "../../types/snapshot";
import { decrypt, encrypt } from "../crypto";

type Payload = {
  tables: Snapshot["tables"];
  tombstones: Snapshot["tombstones"];
};

export async function encryptSnapshot(
  snapshot: Snapshot,
  passphrase: string
): Promise<EncryptedSnapshot> {
  const payload: Payload = {
    tables: snapshot.tables,
    tombstones: snapshot.tombstones,
  };
  const ciphertext = await encrypt(JSON.stringify(payload), passphrase);
  return {
    manifest: { ...snapshot.manifest, encrypted: true },
    ciphertext,
  };
}

export async function decryptSnapshot(
  encrypted: EncryptedSnapshot,
  passphrase: string
): Promise<Snapshot> {
  const plaintext = await decrypt(encrypted.ciphertext, passphrase);
  const payload = JSON.parse(plaintext) as Payload;
  return {
    manifest: { ...encrypted.manifest, encrypted: false },
    tables: payload.tables,
    tombstones: payload.tombstones,
  };
}

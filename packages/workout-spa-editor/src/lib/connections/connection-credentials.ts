/**
 * Credential encryption for device-local connection records. Wraps the app's
 * AES-GCM `lib/crypto` with a device-bound passphrase so a stored credential
 * (e.g. an intervals.icu API key) is ciphertext at rest and bound to this
 * device — matching the device-local connection-record contract (#714, D4/D5).
 */
import { decrypt, encrypt } from "../crypto";

export type ConnectionCredentials = {
  encrypt: (plaintext: string) => Promise<string>;
  decrypt: (blob: string) => Promise<string>;
};

export const createConnectionCredentials = (
  getPassphrase: () => string
): ConnectionCredentials => ({
  encrypt: (plaintext) => encrypt(plaintext, getPassphrase()),
  decrypt: (blob) => decrypt(blob, getPassphrase()),
});

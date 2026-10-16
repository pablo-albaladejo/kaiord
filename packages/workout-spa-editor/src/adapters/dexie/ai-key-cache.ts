/**
 * Plaintext API keys this session has already decrypted or encrypted, keyed
 * by ciphertext. Each decrypt derives a 100k-iteration PBKDF2 key, and every
 * live reader re-reads every provider after every write: uncached, that is
 * one derivation per reader per row per read.
 *
 * The decryption is cached while in flight, so readers that miss together
 * share one derivation; a rejected one is dropped, so a failure is never
 * served from here.
 */
const plaintextByCiphertext = new Map<string, Promise<string>>();

export function rememberKey(cipher: string, plain: string): void {
  plaintextByCiphertext.set(cipher, Promise.resolve(plain));
}

export function decryptOnce(
  cipher: string,
  decrypt: (cipher: string) => Promise<string>
): Promise<string> {
  const known = plaintextByCiphertext.get(cipher);
  if (known !== undefined) return known;
  const pending = decrypt(cipher);
  plaintextByCiphertext.set(cipher, pending);
  pending.catch(() => {
    if (plaintextByCiphertext.get(cipher) === pending)
      plaintextByCiphertext.delete(cipher);
  });
  return pending;
}

export function forgetKey(cipher: string): void {
  plaintextByCiphertext.delete(cipher);
}

/** Drops every key whose ciphertext is no longer stored. */
export function retainKeys(stored: ReadonlySet<string>): void {
  for (const cipher of plaintextByCiphertext.keys())
    if (!stored.has(cipher)) plaintextByCiphertext.delete(cipher);
}

export function clearKeyCache(): void {
  plaintextByCiphertext.clear();
}

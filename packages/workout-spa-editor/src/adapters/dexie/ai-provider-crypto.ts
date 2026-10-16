import Dexie from "dexie";

import { decrypt, encrypt } from "../../lib/crypto";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { decryptOnce, rememberKey } from "./ai-key-cache";

// Defense-in-depth: protects API keys against casual IndexedDB browsing
// but not against a determined attacker with DevTools access (passphrase
// is in the JS bundle). A user-supplied PIN could strengthen this in v2.
const PASSPHRASE = "kaiord-spa-v1";

// WebCrypto promises are not Dexie promises: awaiting one inside a Dexie
// transaction lets the IDB transaction auto-commit first (PrematureCommitError).
// `Dexie.waitFor` keeps the transaction alive across the await, and is a plain
// pass-through when there is no transaction in scope. Required since these
// repos are called from inside `PersistencePort.transaction` — e.g. the
// `withTombstones` existence probe before a provider delete.
// A provider restored from a backup is stored without `apiKey` until the
// user enters one; entering one clears `apiKeyMissing`.
export type StoredProvider = Omit<LlmProviderConfig, "apiKey"> & {
  apiKey?: string;
};

export async function encryptProvider(
  p: LlmProviderConfig
): Promise<StoredProvider> {
  const { apiKey, apiKeyMissing, ...rest } = p;
  if (!apiKey && apiKeyMissing) return { ...rest, apiKeyMissing };
  const cipher = await Dexie.waitFor(encrypt(apiKey, PASSPHRASE));
  rememberKey(cipher, apiKey);
  return { ...rest, apiKey: cipher };
}

export async function decryptProvider(
  p: StoredProvider
): Promise<LlmProviderConfig> {
  if (typeof p.apiKey !== "string")
    return { ...p, apiKey: "", apiKeyMissing: true };
  const cipher = p.apiKey;
  const plain = decryptOnce(cipher, (c) => decrypt(c, PASSPHRASE));
  return { ...p, apiKey: await Dexie.waitFor(plain) };
}

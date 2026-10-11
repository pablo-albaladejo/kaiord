import {
  type ProviderCredential,
  type ProviderKeyCheck,
  verifyProviderKey,
} from "@kaiord/ai/providers";

export type KeySaveOutcome = "saved" | "invalid" | "unverified" | "failed";

export type SaveWithKeyCheckArgs = {
  /** The key to check; omit it when the save does not change the key. */
  credential?: ProviderCredential;
  save: () => Promise<unknown>;
  verify?: (credential: ProviderCredential) => Promise<ProviderKeyCheck>;
};

/**
 * Saves a provider only once its key is not known to be wrong. A key the
 * provider rejects is never stored; a key that could not be checked (offline,
 * rate limit, outage) is stored and reported as unverified, so going offline
 * never blocks configuring a provider.
 */
export const saveWithKeyCheck = async ({
  credential,
  save,
  verify = verifyProviderKey,
}: SaveWithKeyCheckArgs): Promise<KeySaveOutcome> => {
  const check = credential ? await verify(credential) : "valid";
  if (check === "invalid") return "invalid";
  try {
    await save();
  } catch {
    return "failed";
  }
  return check === "unverified" ? "unverified" : "saved";
};

/**
 * addProvider — creates a new AI provider.
 *
 * Invariant I1: when no provider exists yet, the new one becomes the
 * default. The "are we empty?" check runs before the put, so a single
 * concurrent writer could race; we accept that window because the
 * SPA is single-tab single-user and Dexie's IDB transactions cannot
 * span the WebCrypto await inside the repository's encryption pass.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type {
  LlmProviderConfig,
  LlmProviderType,
} from "../../store/ai-store-types";

export type AddProviderInput = {
  type: LlmProviderType;
  apiKey: string;
  model: string;
  label: string;
};

export const addProvider = async (
  persistence: PersistencePort,
  input: AddProviderInput
): Promise<LlmProviderConfig> => {
  const existing = await persistence.aiProviders.getAll();
  const provider: LlmProviderConfig = {
    ...input,
    id: crypto.randomUUID(),
    isDefault: existing.length === 0,
  };
  await persistence.aiProviders.put(provider);
  return provider;
};

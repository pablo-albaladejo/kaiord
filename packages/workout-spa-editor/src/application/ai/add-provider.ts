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
import { defaultProviderLabel } from "./provider-label";

export type AddProviderInput = {
  type: LlmProviderType;
  apiKey: string;
  /** Optional: a blank label becomes the provider's name. */
  label: string;
  keyCheck?: LlmProviderConfig["keyCheck"];
};

export const addProvider = async (
  persistence: PersistencePort,
  input: AddProviderInput
): Promise<LlmProviderConfig> => {
  const existing = await persistence.aiProviders.getAll();
  const label =
    input.label.trim() ||
    defaultProviderLabel(
      input.type,
      existing.map((p) => p.label)
    );
  const provider: LlmProviderConfig = {
    ...input,
    label,
    id: crypto.randomUUID(),
    isDefault: existing.length === 0,
    // Drives orderBy("createdAt") in the repository; immutable after
    // creation (updateProvider's typed input excludes this field).
    createdAt: Date.now(),
  };
  await persistence.aiProviders.put(provider);
  return provider;
};

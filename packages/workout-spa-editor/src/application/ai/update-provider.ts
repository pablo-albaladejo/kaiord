/**
 * updateProvider — applies a partial update to an existing provider.
 *
 * Read-modify-write executed sequentially. Throws
 * `ProviderNotFoundError` so the caller can render a precise toast.
 * No `persistence.transaction` wrapper because the repository's
 * WebCrypto pass voids any IDB-level Dexie transaction; in
 * single-tab single-user the read-then-write window is acceptable.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { ProviderNotFoundError } from "./errors";

export type UpdateProviderInput = Partial<
  Pick<LlmProviderConfig, "type" | "apiKey" | "model" | "label">
>;

// Drop `undefined` values so callers cannot blank required fields by
// passing a half-built object (e.g. `{ apiKey: undefined }` would
// otherwise erase the stored key).
const stripUndefined = <T extends object>(o: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o) as Array<[keyof T, T[keyof T]]>) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

export const updateProvider = async (
  persistence: PersistencePort,
  providerId: string,
  updates: UpdateProviderInput
): Promise<LlmProviderConfig> => {
  const existing = await persistence.aiProviders.getById(providerId);
  if (!existing) throw new ProviderNotFoundError(providerId);

  const updated: LlmProviderConfig = {
    ...existing,
    ...stripUndefined(updates),
  };
  await persistence.aiProviders.put(updated);
  return updated;
};

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
import { uniqueProviderLabel } from "./provider-label";

export type UpdateProviderInput = Partial<
  Pick<LlmProviderConfig, "type" | "apiKey" | "label" | "keyCheck">
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
  if (updates.label !== undefined) {
    // A new name follows the same rule as a new account: never a repeat.
    const others = (await persistence.aiProviders.getAll())
      .filter((p) => p.id !== providerId)
      .map((p) => p.label);
    updated.label = uniqueProviderLabel(
      updates.label.trim() || existing.label,
      updated.type,
      others
    );
  }
  await persistence.aiProviders.put(updated);
  return updated;
};

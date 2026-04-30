/**
 * useAiProvidersLive — reactive read hook for AI provider configs.
 *
 * Reads through `aiProviderRepository.getAll()` so consumers receive
 * plaintext apiKeys (the repository decrypts at the boundary). Every
 * write through `PersistencePort.aiProviders.put` re-fires this query.
 *
 * Returns `undefined` while resolving on first mount; consumers SHALL
 * treat that as loading and not confuse it with the empty-list state.
 *
 * Do NOT wrap in `db.transaction("r", ...)` — the read transaction
 * commits at the first WebCrypto await inside `decryptProvider`, so
 * the wrapper is moot. Snapshot consistency comes from `toArray()`'s
 * JS-memory copy, not from a Dexie read transaction.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { aiProviderRepository } from "../adapters/dexie";
import type { LlmProviderConfig } from "../store/ai-store-types";

export const useAiProvidersLive = (): LlmProviderConfig[] | undefined =>
  useLiveQuery<LlmProviderConfig[]>(() => aiProviderRepository.getAll(), []);

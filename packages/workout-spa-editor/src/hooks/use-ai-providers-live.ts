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
 * A provider restored from a backup without its key (`apiKeyMissing`) is
 * left out, so no AI feature can pick it; the provider settings list asks
 * for it with `includeKeyless` to offer entering the key.
 *
 * Do NOT wrap in `db.transaction("r", ...)` — the read transaction
 * commits at the first WebCrypto await inside `decryptProvider`, so
 * the wrapper is moot. Snapshot consistency comes from `toArray()`'s
 * JS-memory copy, not from a Dexie read transaction.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { aiProviderRepository } from "../adapters/dexie";
import type { LlmProviderConfig } from "../store/ai-store-types";

export const useAiProvidersLive = ({
  includeKeyless = false,
}: { includeKeyless?: boolean } = {}): LlmProviderConfig[] | undefined => {
  const all = useLiveQuery<LlmProviderConfig[]>(
    () => aiProviderRepository.getAll(),
    []
  );
  return useMemo(
    () => (includeKeyless ? all : all?.filter((p) => !p.apiKeyMissing)),
    [all, includeKeyless]
  );
};

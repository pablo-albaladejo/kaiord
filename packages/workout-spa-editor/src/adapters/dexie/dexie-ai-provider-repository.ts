/**
 * Dexie AI Provider Repository
 *
 * IndexedDB-backed implementation of AiProviderRepository.
 * Encrypts API keys before storing, decrypts after reading.
 */

import type { AiProviderRepository } from "../../ports/persistence-port";
import { forgetKey, retainKeys } from "./ai-key-cache";
import {
  decryptProvider,
  encryptProvider,
  type StoredProvider,
} from "./ai-provider-crypto";
import type { KaiordDatabase } from "./dexie-database";

const CUSTOM_PROMPT_KEY = "ai_custom_prompt";

export function createDexieAiProviderRepository(
  db: KaiordDatabase
): AiProviderRepository {
  const table = () => db.table("aiProviders");
  const meta = () => db.table("meta");

  return {
    getAll: async () => {
      // orderBy("createdAt") guarantees insertion-order surfacing so
      // the ModelSelector / SettingsPanel listings are stable across
      // reloads. PK-default ordering (UUID) is essentially random.
      // Supersedes the locale-aware label sort that landed in main —
      // insertion order matches the user's mental model of "the one I
      // added most recently is at the bottom" better than alphabetical.
      const all: StoredProvider[] = await table()
        .orderBy("createdAt")
        .toArray();
      retainKeys(new Set(all.flatMap((p) => p.apiKey ?? [])));
      return Promise.all(all.map(decryptProvider));
    },

    getById: async (id) => {
      const p = await table().get(id);
      return p ? decryptProvider(p) : undefined;
    },

    put: async (provider) => {
      const previous: StoredProvider | undefined = await table().get(
        provider.id
      );
      const next = await encryptProvider(provider);
      await table().put(next);
      if (previous?.apiKey && previous.apiKey !== next.apiKey)
        forgetKey(previous.apiKey);
    },

    delete: async (id) => {
      const previous: StoredProvider | undefined = await table().get(id);
      await table().delete(id);
      if (previous?.apiKey) forgetKey(previous.apiKey);
    },

    getCustomPrompt: async () => {
      const row = await meta().get(CUSTOM_PROMPT_KEY);
      return typeof row?.value === "string" ? row.value : null;
    },

    setCustomPrompt: async (prompt) => {
      await meta().put({ key: CUSTOM_PROMPT_KEY, value: prompt });
    },
  };
}

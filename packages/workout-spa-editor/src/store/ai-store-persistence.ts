/**
 * AI Store Persistence
 *
 * Persists AI providers to IndexedDB via Dexie with encryption.
 * Custom prompt stored in the meta table.
 */

import { createDexieAiProviderRepository } from "../adapters/dexie/dexie-ai-provider-repository";
import { db } from "../adapters/dexie/dexie-database";
import type { LlmProviderConfig } from "./ai-store-types";

const repo = createDexieAiProviderRepository(db);
const metaTable = () => db.table("meta");

type PersistedAiData = {
  providers: Array<LlmProviderConfig>;
  customPrompt: string;
};

export const persistAiData = async (data: PersistedAiData): Promise<void> => {
  try {
    await Promise.all([
      ...data.providers.map((p) => repo.put(p)),
      metaTable().put({ key: "ai_custom_prompt", value: data.customPrompt }),
    ]);
  } catch {
    /* silent - best-effort persistence */
  }
};

export const loadAiData = async (): Promise<PersistedAiData> => {
  try {
    const [providers, meta] = await Promise.all([
      repo.getAll(),
      metaTable().get("ai_custom_prompt"),
    ]);
    return {
      providers,
      customPrompt: (meta?.value as string) ?? "",
    };
  } catch {
    return { providers: [], customPrompt: "" };
  }
};

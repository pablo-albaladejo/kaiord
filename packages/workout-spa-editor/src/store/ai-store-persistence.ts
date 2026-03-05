import { createSecureStorage } from "../lib/secure-storage";
import type { LlmProviderConfig } from "./ai-store-types";

const STORAGE_KEY = "ai_providers";
const storage = createSecureStorage("kaiord-spa-v1");

type PersistedAiData = {
  providers: Array<LlmProviderConfig>;
  customPrompt: string;
};

export const persistAiData = async (data: PersistedAiData): Promise<void> => {
  try {
    await storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* silent — best-effort persistence */
  }
};

export const loadAiData = async (): Promise<PersistedAiData> => {
  try {
    const raw = await storage.get(STORAGE_KEY);
    if (!raw) return { providers: [], customPrompt: "" };
    return JSON.parse(raw) as PersistedAiData;
  } catch {
    return { providers: [], customPrompt: "" };
  }
};

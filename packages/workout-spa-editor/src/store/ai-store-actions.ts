import { loadAiData, persistAiData } from "./ai-store-persistence";
import type { AiStore } from "./ai-store-types";

type Set = (fn: Partial<AiStore> | ((s: AiStore) => Partial<AiStore>)) => void;
type Get = () => AiStore;

const generateId = (): string =>
  `llm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const persist = (get: Get): void => {
  const { providers, customPrompt } = get();
  persistAiData({ providers, customPrompt });
};

export const createAiActions = (set: Set, get: Get) => ({
  hydrate: async () => {
    const data = await loadAiData();
    set({
      providers: data.providers,
      customPrompt: data.customPrompt,
      hydrated: true,
    });
  },

  addProvider: (config: Parameters<AiStore["addProvider"]>[0]) => {
    const id = generateId();
    const isFirst = get().providers.length === 0;
    set((s) => ({
      providers: [...s.providers, { ...config, id, isDefault: isFirst }],
      selectedProviderId: isFirst ? id : s.selectedProviderId,
    }));
    persist(get);
    return id;
  },

  removeProvider: (id: string) => {
    set((s) => {
      const remaining = s.providers.filter((p) => p.id !== id);
      const wasDefault = s.providers.find((p) => p.id === id)?.isDefault;
      if (wasDefault && remaining.length > 0)
        remaining[0] = { ...remaining[0], isDefault: true };
      return {
        providers: remaining,
        selectedProviderId:
          s.selectedProviderId === id
            ? (remaining.find((p) => p.isDefault)?.id ?? null)
            : s.selectedProviderId,
      };
    });
    persist(get);
  },

  updateProvider: (
    id: string,
    updates: Parameters<AiStore["updateProvider"]>[1]
  ) => {
    set((s) => ({
      providers: s.providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    persist(get);
  },

  setDefault: (id: string) => {
    set((s) => ({
      providers: s.providers.map((p) => ({ ...p, isDefault: p.id === id })),
    }));
    persist(get);
  },

  setCustomPrompt: (prompt: string) => {
    set({ customPrompt: prompt });
    persist(get);
  },
});

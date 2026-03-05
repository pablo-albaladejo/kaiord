import { create } from "zustand";
import type { AiStore } from "./ai-store-types";

export type {
  LlmProviderType,
  LlmProviderConfig,
  AiStore,
} from "./ai-store-types";

const generateId = (): string =>
  `llm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useAiStore = create<AiStore>((set, get) => ({
  providers: [],
  customPrompt: "",
  selectedProviderId: null,
  generation: { status: "idle" },

  addProvider: (config) => {
    const id = generateId();
    const isFirst = get().providers.length === 0;
    set((s) => ({
      providers: [...s.providers, { ...config, id, isDefault: isFirst }],
      selectedProviderId: isFirst ? id : s.selectedProviderId,
    }));
    return id;
  },

  removeProvider: (id) =>
    set((s) => {
      const remaining = s.providers.filter((p) => p.id !== id);
      const needsNewDefault =
        s.providers.find((p) => p.id === id)?.isDefault && remaining.length > 0;
      if (needsNewDefault) remaining[0] = { ...remaining[0], isDefault: true };
      return {
        providers: remaining,
        selectedProviderId:
          s.selectedProviderId === id
            ? (remaining.find((p) => p.isDefault)?.id ?? null)
            : s.selectedProviderId,
      };
    }),

  updateProvider: (id, updates) =>
    set((s) => ({
      providers: s.providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  setDefault: (id) =>
    set((s) => ({
      providers: s.providers.map((p) => ({
        ...p,
        isDefault: p.id === id,
      })),
    })),

  selectForGeneration: (id) => set({ selectedProviderId: id }),

  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),

  setGeneration: (generation) => set({ generation }),

  getSelectedProvider: () => {
    const { providers, selectedProviderId } = get();
    return (
      providers.find((p) => p.id === selectedProviderId) ??
      providers.find((p) => p.isDefault) ??
      null
    );
  },

  getDefaultProvider: () => get().providers.find((p) => p.isDefault) ?? null,
}));

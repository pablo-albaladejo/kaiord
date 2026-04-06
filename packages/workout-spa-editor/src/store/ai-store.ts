import { create } from "zustand";

import { createAiActions } from "./ai-store-actions";
import type { AiStore } from "./ai-store-types";

export type {
  AiStore,
  LlmProviderConfig,
  LlmProviderType,
} from "./ai-store-types";

export const useAiStore = create<AiStore>((set, get) => ({
  providers: [],
  customPrompt: "",
  selectedProviderId: null,
  generation: { status: "idle" },
  hydrated: false,

  ...createAiActions(set, get),

  selectForGeneration: (id) => set({ selectedProviderId: id }),
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

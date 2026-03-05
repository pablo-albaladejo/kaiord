import { create } from "zustand";

export type LlmProviderType = "anthropic" | "openai" | "google";

export type LlmProviderConfig = {
  id: string;
  type: LlmProviderType;
  apiKey: string;
  model: string;
  label: string;
  isDefault: boolean;
};

type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };

export type AiStore = {
  providers: Array<LlmProviderConfig>;
  customPrompt: string;
  selectedProviderId: string | null;
  generation: GenerationState;
  addProvider: (
    config: Omit<LlmProviderConfig, "id" | "isDefault">
  ) => string;
  removeProvider: (id: string) => void;
  updateProvider: (
    id: string,
    updates: Partial<Omit<LlmProviderConfig, "id">>
  ) => void;
  setDefault: (id: string) => void;
  selectForGeneration: (id: string | null) => void;
  setCustomPrompt: (prompt: string) => void;
  setGeneration: (state: GenerationState) => void;
  getSelectedProvider: () => LlmProviderConfig | null;
  getDefaultProvider: () => LlmProviderConfig | null;
};

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
      providers: [
        ...s.providers,
        { ...config, id, isDefault: isFirst },
      ],
      selectedProviderId: isFirst ? id : s.selectedProviderId,
    }));
    return id;
  },

  removeProvider: (id) =>
    set((s) => {
      const remaining = s.providers.filter((p) => p.id !== id);
      const needsNewDefault =
        s.providers.find((p) => p.id === id)?.isDefault &&
        remaining.length > 0;
      if (needsNewDefault) remaining[0].isDefault = true;
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

  getDefaultProvider: () =>
    get().providers.find((p) => p.isDefault) ?? null,
}));

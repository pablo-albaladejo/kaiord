export type LlmProviderType = "anthropic" | "openai" | "google";

export type LlmProviderConfig = {
  id: string;
  type: LlmProviderType;
  apiKey: string;
  model: string;
  label: string;
  isDefault: boolean;
};

export type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };

export type AiStore = {
  providers: Array<LlmProviderConfig>;
  customPrompt: string;
  selectedProviderId: string | null;
  generation: GenerationState;
  hydrated: boolean;
  addProvider: (config: Omit<LlmProviderConfig, "id" | "isDefault">) => string;
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
  hydrate: () => Promise<void>;
};

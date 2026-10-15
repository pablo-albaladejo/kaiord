/**
 * AI Runtime Store
 *
 * Holds editor-runtime-only state for AI generation: which provider
 * the user has selected for the next call, and the in-flight status
 * of that call. NEVER touches Dexie. Persisted state (providers,
 * customPrompt) lives in IndexedDB and is read via live hooks.
 *
 * Splitting these slices is what closes the latent bug behind #385:
 * persisted state is the system of record (Dexie + useLiveQuery),
 * Zustand only owns volatile session state that does not survive a
 * refresh by design.
 */

import { create } from "zustand";

import type { GenerationState } from "./ai-store-types";

/** A provider and one of its models, always chosen together. */
export type ChatModelChoice = { providerId: string; modelId: string };

/** A chat draft's own model, scoped to the athlete whose draft chose it. */
export type ChatDraftModel = ChatModelChoice & { profileId: string };

export type AiRuntimeStore = {
  selectedProviderId: string | null;
  generation: GenerationState;
  /** An unsaved chat draft's own model; null follows the chat default. */
  chatDraftModel: ChatDraftModel | null;
  selectForGeneration: (id: string | null) => void;
  setGeneration: (state: GenerationState) => void;
  setChatDraftModel: (model: ChatDraftModel | null) => void;
};

export const useAiRuntimeStore = create<AiRuntimeStore>((set) => ({
  selectedProviderId: null,
  generation: { status: "idle" },
  chatDraftModel: null,
  selectForGeneration: (selectedProviderId) => set({ selectedProviderId }),
  setGeneration: (generation) => set({ generation }),
  setChatDraftModel: (chatDraftModel) => set({ chatDraftModel }),
}));

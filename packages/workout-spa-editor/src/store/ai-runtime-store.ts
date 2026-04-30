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

export type AiRuntimeStore = {
  selectedProviderId: string | null;
  generation: GenerationState;
  selectForGeneration: (id: string | null) => void;
  setGeneration: (state: GenerationState) => void;
};

export const useAiRuntimeStore = create<AiRuntimeStore>((set) => ({
  selectedProviderId: null,
  generation: { status: "idle" },
  selectForGeneration: (selectedProviderId) => set({ selectedProviderId }),
  setGeneration: (generation) => set({ generation }),
}));

/**
 * Resolves the chat-page provider/model pair. An unsaved draft's own choice
 * (provider and model together) wins while its provider still exists, its
 * model healed past retirement; otherwise chat runs the athlete's `chat`
 * resolution — the same one the AI settings show — never a provider flag.
 * Generation always uses the `workout_generation` resolution.
 */
import { resolveModelForPurpose, usableModel } from "@kaiord/ai/providers";

import type { ChatDraftModel } from "../../store/ai-runtime-store";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { AiModelBinding } from "../../types/ai-model-binding";

export type ChatModels = {
  provider: LlmProviderConfig | null;
  modelId: string | null;
  generationProvider: LlmProviderConfig | null;
  generationModelId: string | null;
  /** True when the draft runs its own choice, not the chat default. */
  chosen: boolean;
};

export const resolveChatModels = (
  providers: LlmProviderConfig[],
  bindings: AiModelBinding[],
  draft: ChatDraftModel | null
): ChatModels => {
  const chat = resolveModelForPurpose("chat", providers, bindings);
  const gen = resolveModelForPurpose("workout_generation", providers, bindings);
  const generation = {
    generationProvider: gen?.provider ?? null,
    generationModelId: gen?.modelId ?? null,
  };
  const own = providers.find((p) => p.id === draft?.providerId);
  if (own && draft?.modelId.trim()) {
    const modelId = usableModel(own.type, draft.modelId);
    return { provider: own, modelId, ...generation, chosen: true };
  }
  return {
    provider: chat?.provider ?? null,
    modelId: chat?.modelId ?? null,
    ...generation,
    chosen: false,
  };
};

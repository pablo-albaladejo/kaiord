/**
 * Resolves the chat-page provider/model pair, honouring the runtime
 * `selectedProviderId` override from the ModelSelector. When a provider is
 * explicitly selected it wins as the provider; the model keeps the chat
 * resolution only if that provider matches, otherwise it falls back to the
 * provider type's catalog default. Generation always uses the
 * `workout_generation` resolution untouched by the selector.
 */
import { getDefaultModel, resolveModelForPurpose } from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { AiModelBinding } from "../../types/ai-model-binding";

export type ChatModels = {
  provider: LlmProviderConfig | null;
  modelId: string | null;
  generationProvider: LlmProviderConfig | null;
  generationModelId: string | null;
};

export const resolveChatModels = (
  providers: LlmProviderConfig[],
  bindings: AiModelBinding[],
  selectedId: string | null
): ChatModels => {
  const chat = resolveModelForPurpose("chat", providers, bindings);
  const gen = resolveModelForPurpose("workout_generation", providers, bindings);
  const selected = providers.find((p) => p.id === selectedId) ?? null;

  if (!selected) {
    return {
      provider: chat?.provider ?? null,
      modelId: chat?.modelId ?? null,
      generationProvider: gen?.provider ?? null,
      generationModelId: gen?.modelId ?? null,
    };
  }

  const modelId =
    chat && chat.provider.id === selected.id
      ? chat.modelId
      : (selected.model ?? getDefaultModel(selected.type));
  return {
    provider: selected,
    modelId,
    generationProvider: gen?.provider ?? null,
    generationModelId: gen?.modelId ?? null,
  };
};

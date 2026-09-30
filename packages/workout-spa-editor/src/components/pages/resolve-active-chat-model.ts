/**
 * Resolves the model for the active conversation: its per-conversation
 * `providerId`/`modelId` override when both are set and the provider still
 * exists, otherwise the page-level chat default (`resolveChatModels`). This is
 * the read side of the per-conversation model (D9); a draft has no row yet, so
 * it always uses the fallback.
 *
 * The override is stamped on the first turn, so a conversation started under
 * a since-retired default carries that id forever: it heals to its same-tier
 * successor here, and `requestedModelId` keeps the stored id so the page can
 * say "X was retired, using Y".
 */
import { usableModel } from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { ChatModels } from "./resolve-chat-models";

export type ActiveChatModel = {
  provider: LlmProviderConfig | null;
  modelId: string | null;
  /** The model id as stored, before retirement healing. */
  requestedModelId: string | null;
};

export const resolveActiveChatModel = (
  conversation: ChatConversationRecord | undefined,
  providers: LlmProviderConfig[],
  fallback: ChatModels
): ActiveChatModel => {
  if (conversation?.providerId && conversation.modelId) {
    const provider = providers.find((p) => p.id === conversation.providerId);
    if (provider) {
      return {
        provider,
        modelId: usableModel(provider.type, conversation.modelId),
        requestedModelId: conversation.modelId,
      };
    }
  }
  return {
    provider: fallback.provider,
    modelId: fallback.modelId,
    requestedModelId: fallback.modelId,
  };
};

/**
 * Model-change handler for the chat page. A persisted conversation stores its
 * own `providerId`/`modelId` override (D9); an unsaved draft writes the
 * volatile runtime selection so the page-level resolver reflects it until the
 * first message persists the conversation.
 */
import { useCallback } from "react";

import { setConversationModel } from "../application/chat/set-conversation-model";
import { usePersistence } from "../contexts/persistence-context";
import { getDefaultModel } from "../lib/provider-models";
import { useAiRuntimeStore } from "../store/ai-runtime-store";
import type { LlmProviderConfig } from "../store/ai-store-types";
import { logger } from "../utils/logger";

export type ChatModelSelectionArgs = {
  profileId: string | null;
  activeId: string | null;
  isDraft: boolean;
  providers: LlmProviderConfig[];
};

export const useChatModelSelection = ({
  profileId,
  activeId,
  isDraft,
  providers,
}: ChatModelSelectionArgs): ((providerId: string) => void) => {
  const persistence = usePersistence();
  const selectForGeneration = useAiRuntimeStore((s) => s.selectForGeneration);
  return useCallback(
    (providerId: string) => {
      if (!profileId || !activeId || isDraft) {
        selectForGeneration(providerId);
        return;
      }
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return;
      void setConversationModel(
        persistence,
        profileId,
        activeId,
        providerId,
        provider.model ?? getDefaultModel(provider.type)
      ).catch((error: unknown) => {
        logger.error("Failed to persist chat conversation model override", {
          error,
        });
        selectForGeneration(providerId);
      });
    },
    [persistence, selectForGeneration, profileId, activeId, isDraft, providers]
  );
};

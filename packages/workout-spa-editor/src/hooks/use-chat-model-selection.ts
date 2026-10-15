/**
 * Model handlers for the chat page. A persisted conversation stores its own
 * `providerId`/`modelId` override (D9), healed past retirement, and following
 * the main model again clears it; an unsaved draft keeps its choice in
 * volatile runtime state until the first message stamps it. A blank model id
 * is never stored.
 */
import { usableModel } from "@kaiord/ai/providers";
import { useCallback, useMemo } from "react";

import {
  clearConversationModel,
  setConversationModel,
} from "../application/chat/set-conversation-model";
import { usePersistence } from "../contexts/persistence-context";
import {
  type ChatModelChoice,
  useAiRuntimeStore,
} from "../store/ai-runtime-store";
import type { LlmProviderConfig } from "../store/ai-store-types";
import { logger } from "../utils/logger";

export type ChatModelSelectionArgs = {
  profileId: string | null;
  activeId: string | null;
  isDraft: boolean;
  providers: LlmProviderConfig[];
};

export type ChatModelSelection = {
  choose: (choice: ChatModelChoice) => void;
  follow: () => void;
};

const logFailure = (error: unknown) =>
  logger.error("Failed to persist chat conversation model override", {
    error,
  });

export const useChatModelSelection = ({
  profileId,
  activeId,
  isDraft,
  providers,
}: ChatModelSelectionArgs): ChatModelSelection => {
  const persistence = usePersistence();
  const setDraft = useAiRuntimeStore((s) => s.setChatDraftModel);

  const choose = useCallback(
    ({ providerId, modelId }: ChatModelChoice) => {
      const provider = providers.find((p) => p.id === providerId);
      if (!provider || !profileId || !modelId.trim()) return;
      const healed = usableModel(provider.type, modelId);
      if (isDraft || !activeId) {
        return setDraft({ profileId, providerId, modelId: healed });
      }
      void setConversationModel(
        persistence,
        profileId,
        activeId,
        providerId,
        healed
      ).catch(logFailure);
    },
    [persistence, setDraft, profileId, activeId, isDraft, providers]
  );

  const follow = useCallback(() => {
    if (isDraft || !profileId || !activeId) return setDraft(null);
    void clearConversationModel(persistence, profileId, activeId).catch(
      logFailure
    );
  }, [persistence, setDraft, profileId, activeId, isDraft]);

  return useMemo(() => ({ choose, follow }), [choose, follow]);
};

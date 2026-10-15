import { useEffect } from "react";

import { clearConversationModel } from "../../application/chat/set-conversation-model";
import { usePersistence } from "../../contexts/persistence-context";
import { useAiProvidersLive } from "../../hooks/use-ai-providers-live";
import {
  type ChatDraftModel,
  useAiRuntimeStore,
} from "../../store/ai-runtime-store";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import { logger } from "../../utils/logger";

type ChatModelCleanupArgs = {
  profileId: string | null;
  /** True while no saved conversation is open (a draft, or nothing). */
  drafting: boolean;
  active: ChatConversationRecord | undefined;
};

/**
 * The draft choice that applies here, if any, dropping stale model state:
 * a draft's choice once a saved conversation is open (its first message has
 * already stamped it) or once another athlete is active, and a saved
 * conversation's override whose account no longer exists — the picker could
 * not clear it, since it already shows the main model.
 */
export const useChatModelCleanup = ({
  profileId,
  drafting,
  active,
}: ChatModelCleanupArgs): ChatDraftModel | null => {
  const persistence = usePersistence();
  const draft = useAiRuntimeStore((s) => s.chatDraftModel);
  const setDraft = useAiRuntimeStore((s) => s.setChatDraftModel);
  const applies = drafting && draft?.profileId === profileId;
  useEffect(() => {
    if (draft && !applies) setDraft(null);
  }, [draft, applies, setDraft]);

  // Keyless accounts still exist: only a removed account voids an override.
  const known = useAiProvidersLive({ includeKeyless: true });
  const deadId =
    known &&
    active?.providerId &&
    !known.some((p) => p.id === active.providerId)
      ? active.id
      : null;
  useEffect(() => {
    if (!deadId || !profileId) return;
    void clearConversationModel(persistence, profileId, deadId).catch(
      (error: unknown) =>
        logger.error("Failed to clear a removed account's chat model", {
          error,
        })
    );
  }, [deadId, profileId, persistence]);

  return applies ? draft : null;
};

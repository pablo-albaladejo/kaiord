/**
 * Rename/delete handlers for the chat conversation list. Both await their
 * use case and log failures via the shared logger so a rejected persistence
 * write never surfaces as an unhandled rejection; delete only starts a new
 * draft after the active conversation is actually removed.
 */
import { useCallback } from "react";

import { deleteConversation } from "../application/chat/delete-conversation";
import { renameConversation } from "../application/chat/rename-conversation";
import type { PersistencePort } from "../ports/persistence-port";
import { logger } from "../utils/logger";

export type ChatConversationActionsArgs = {
  persistence: PersistencePort;
  profileId: string | null;
  activeId: string | null;
  startNew: () => void;
};

export const useChatConversationActions = ({
  persistence,
  profileId,
  activeId,
  startNew,
}: ChatConversationActionsArgs) => {
  const rename = useCallback(
    async (id: string, title: string) => {
      if (!profileId) return;
      try {
        await renameConversation(persistence, profileId, id, title);
      } catch (error) {
        logger.error("Failed to rename chat conversation", { error });
      }
    },
    [persistence, profileId]
  );
  const remove = useCallback(
    async (id: string) => {
      if (!profileId) return;
      try {
        await deleteConversation(persistence, profileId, id);
        if (id === activeId) startNew();
      } catch (error) {
        logger.error("Failed to delete chat conversation", { error });
      }
    },
    [persistence, profileId, activeId, startNew]
  );
  return { rename, remove };
};

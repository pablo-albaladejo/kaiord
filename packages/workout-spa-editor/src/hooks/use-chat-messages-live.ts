/**
 * useChatMessagesLive — reactive read hook for the active conversation's
 * transcript. One `useLiveQuery`: every `append`/`deleteByConversation`
 * through the same Dexie table re-fires it.
 *
 * Returns `undefined` while resolving on first mount (treat as loading), then
 * the conversation's messages in ascending `createdAt` order. A null
 * `profileId` or `conversationId` (e.g. an unsaved draft) yields an empty
 * transcript without touching the table.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { chatMessageRepository } from "../adapters/dexie";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";

export const useChatMessagesLive = (
  profileId: string | null,
  conversationId: string | null
): ChatMessageRecord[] | undefined =>
  useLiveQuery<ChatMessageRecord[]>(
    () =>
      profileId && conversationId
        ? chatMessageRepository.listByConversation(profileId, conversationId)
        : Promise.resolve([]),
    [profileId, conversationId]
  );

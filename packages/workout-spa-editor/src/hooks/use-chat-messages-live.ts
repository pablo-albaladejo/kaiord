/**
 * useChatMessagesLive — reactive read hook for the active profile's chat
 * transcript. One `useLiveQuery` per page (the spa-routing read primitive):
 * every `append`/`deleteByProfile` through the same Dexie table re-fires it.
 *
 * Returns `undefined` while resolving on first mount (treat as loading),
 * then the profile's messages in ascending `createdAt` order. A null
 * `profileId` yields an empty transcript without touching the table.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { chatMessageRepository } from "../adapters/dexie";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";

export const useChatMessagesLive = (
  profileId: string | null
): ChatMessageRecord[] | undefined =>
  useLiveQuery<ChatMessageRecord[]>(
    () =>
      profileId
        ? chatMessageRepository.listByProfile(profileId)
        : Promise.resolve([]),
    [profileId]
  );

/**
 * useChatConversationsLive — reactive read hook for the active profile's
 * conversation list, most-recently-updated first. One `useLiveQuery`: every
 * `put`/`delete` through the same Dexie table re-fires it.
 *
 * Returns `undefined` while resolving on first mount (treat as loading), then
 * the profile's conversations ordered by `updatedAt` descending. A null
 * `profileId` yields an empty list without touching the table.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { chatConversationRepository } from "../adapters/dexie";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";

export const useChatConversationsLive = (
  profileId: string | null
): ChatConversationRecord[] | undefined =>
  useLiveQuery<ChatConversationRecord[]>(
    () =>
      profileId
        ? chatConversationRepository.listByProfile(profileId)
        : Promise.resolve([]),
    [profileId]
  );

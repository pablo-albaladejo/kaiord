/**
 * useChatSearchPanel — chat search plus the transient focused-message state.
 *
 * Wraps `useChatSearch` and tracks which matched message to highlight in the
 * open thread. Selecting a result focuses its message and opens the conversation
 * via `select`; the highlight persists until the query changes (deep-link URL is
 * untouched — `select` owns navigation).
 */
import { useCallback, useEffect, useState } from "react";

import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";
import { type UseChatSearch, useChatSearch } from "./use-chat-search";

export type UseChatSearchPanel = UseChatSearch & {
  focusMessageId: string | null;
  onResultSelect: (conversationId: string, messageId: string) => void;
};

export const useChatSearchPanel = (
  profileId: string | null,
  conversations: ChatConversationRecord[],
  select: (conversationId: string) => void
): UseChatSearchPanel => {
  const search = useChatSearch(profileId, conversations);
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);

  useEffect(() => setFocusMessageId(null), [search.query]);

  const onResultSelect = useCallback(
    (conversationId: string, messageId: string) => {
      setFocusMessageId(messageId);
      select(conversationId);
    },
    [select]
  );

  return { ...search, focusMessageId, onResultSelect };
};

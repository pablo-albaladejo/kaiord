/**
 * useChatSearch — query state + lazy, debounced chat search for a profile.
 *
 * The conversation list is already live in the page; this hook adds the message
 * side. It loads the profile's messages once, only when the search first becomes
 * active (an effective, multi-character query), then recomputes results from the
 * debounced query. `active` reflects the raw query so the UI can swap to the
 * results panel immediately, while `results` follow the debounced query to avoid
 * recomputing on every keystroke. Read-only: it never writes to Dexie.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { createDexieChatMessageRepository } from "../adapters/dexie/dexie-chat-message-repository";
import { db } from "../adapters/dexie/dexie-database";
import { tokenize } from "../application/chat/normalize-search-text";
import {
  type ChatSearchResult,
  searchConversations,
} from "../application/chat/search-conversations";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";

const chatMessageRepository = createDexieChatMessageRepository(db);

const DEBOUNCE_MS = 200;

export type UseChatSearch = {
  query: string;
  setQuery: (query: string) => void;
  active: boolean;
  results: ChatSearchResult[];
};

export const useChatSearch = (
  profileId: string | null,
  conversations: ChatConversationRecord[]
): UseChatSearch => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const loadedProfile = useRef<string | null>(null);

  const active = tokenize(query).length > 0;

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!active || !profileId || loadedProfile.current === profileId) return;
    loadedProfile.current = profileId;
    let cancelled = false;
    void chatMessageRepository.listByProfile(profileId).then((rows) => {
      if (!cancelled) setMessages(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [active, profileId]);

  const results = useMemo(
    () => searchConversations(debounced, conversations, messages),
    [debounced, conversations, messages]
  );

  return { query, setQuery, active, results };
};

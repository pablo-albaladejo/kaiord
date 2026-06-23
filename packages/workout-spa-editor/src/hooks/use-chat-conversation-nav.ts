/**
 * Chat conversation navigation: resolves the active conversation from the
 * route + an in-memory draft, deep-links a draft once its first message
 * persists it, and auto-opens a draft for an empty profile. Keeps the draft
 * (D10) out of Dexie until the first message lands.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

import {
  type ActiveConversation,
  resolveActiveConversation,
} from "../components/pages/resolve-active-conversation";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";

export type ChatConversationNav = ActiveConversation & {
  startNew: () => void;
  select: (id: string) => void;
};

export const useChatConversationNav = (
  conversations: ChatConversationRecord[] | undefined,
  routeId: string | undefined
): ChatConversationNav => {
  const [, navigate] = useLocation();
  const [draftId, setDraftId] = useState<string | null>(null);
  const persistedIds = useMemo(
    () => conversations?.map((c) => c.id) ?? [],
    [conversations]
  );
  const resolved = resolveActiveConversation({
    routeId,
    draftId,
    persistedIds,
    firstId: conversations?.[0]?.id,
  });

  useEffect(() => {
    if (draftId && persistedIds.includes(draftId)) {
      setDraftId(null);
      navigate(`/chat/${draftId}`);
    }
  }, [draftId, persistedIds, navigate]);

  useEffect(() => {
    if (conversations?.length === 0 && !draftId && !routeId)
      setDraftId(crypto.randomUUID());
  }, [conversations, draftId, routeId]);

  const startNew = useCallback(() => {
    if (draftId && !persistedIds.includes(draftId)) return;
    setDraftId(crypto.randomUUID());
    navigate("/chat");
  }, [draftId, persistedIds, navigate]);

  const select = useCallback(
    (id: string) => {
      setDraftId(null);
      navigate(`/chat/${id}`);
    },
    [navigate]
  );

  return { ...resolved, startNew, select };
};

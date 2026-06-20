/**
 * The user-facing turn actions for `useChatTurn` (send/approve/deny/retry),
 * split out so the hook body stays under the line cap. Each action no-ops
 * unless the context and any required pending action are present, and emits
 * the count-only analytics events the chat usage rule mandates.
 */
import type { PendingAction } from "@kaiord/ai";
import type { Analytics } from "@kaiord/core";
import { useCallback, useRef } from "react";

import type { ChatMessageRecord } from "../types/chat/chat-message-record";
import { approveAction, denyAction } from "./chat/chat-turn-resume";
import { sendTurn } from "./chat/chat-turn-runner";
import type { ChatTurnCtx, ChatTurnState } from "./chat/chat-turn-types";

export type ChatTurnActions = {
  send: (text: string) => void;
  approve: () => void;
  deny: () => void;
  retry: () => void;
};

export const useChatTurnActions = (
  ctx: ChatTurnCtx | null,
  state: ChatTurnState,
  messages: ChatMessageRecord[],
  pendingAction: PendingAction | null,
  analytics: Analytics
): ChatTurnActions => {
  const lastInputRef = useRef("");
  const send = useCallback(
    (text: string) => {
      if (!ctx || state === "streaming" || !text.trim()) return;
      lastInputRef.current = text;
      analytics.event("chat-message-sent");
      void sendTurn(ctx, messages, text);
    },
    [ctx, state, messages, analytics]
  );
  const approve = useCallback(() => {
    if (!ctx || !pendingAction) return;
    analytics.event("chat-tool-confirmed", { tool: pendingAction.toolName });
    void approveAction(ctx, pendingAction);
  }, [ctx, pendingAction, analytics]);
  const deny = useCallback(() => {
    if (ctx && pendingAction) void denyAction(ctx, pendingAction);
  }, [ctx, pendingAction]);
  const retry = useCallback(() => send(lastInputRef.current), [send]);
  return { send, approve, deny, retry };
};

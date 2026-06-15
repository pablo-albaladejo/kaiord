/**
 * useChatTurn — orchestrates one chat conversation: provider → model →
 * agent → streamed turn → persistence, plus the pending-action
 * confirm/deny resume. Thin wrapper over the testable `chat-turn-runner`
 * functions; components consume only the returned state + actions and never
 * touch the AI SDK or Dexie directly.
 */
import type { ChatAgent, ChatTool, PendingAction } from "@kaiord/ai";
import type { ModelMessage } from "ai";
import { useCallback, useMemo, useRef, useState } from "react";

import { useAnalytics } from "../contexts/analytics-context";
import { usePersistence } from "../contexts/persistence-context";
import { approveAction, denyAction, sendTurn } from "./chat/chat-turn-runner";
import { type ChatTurnState, makeChatTurnCtx } from "./chat/chat-turn-types";
import { useChatActionOps } from "./use-chat-action-ops";
import type { UseChatTurn, UseChatTurnArgs } from "./use-chat-turn-types";

export const useChatTurn = (args: UseChatTurnArgs): UseChatTurn => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const ops = useChatActionOps(args.profileId, {
    provider: args.generationProvider,
    modelId: args.generationModelId,
  });
  const [state, setState] = useState<ChatTurnState>("idle");
  const [streamingText, setStreamingText] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const agentRef = useRef<ChatAgent | null>(null);
  const toolsRef = useRef<ChatTool[]>([]);
  const messagesRef = useRef<ModelMessage[]>([]);
  const lastInputRef = useRef("");

  const { profileId, provider, modelId, today, messages } = args;
  const ctx = useMemo(
    () =>
      makeChatTurnCtx(
        { persistence, profileId, provider, modelId, today, ops },
        { agentRef, toolsRef, messagesRef },
        { setState, setStreamingText, setPendingAction, setError }
      ),
    [persistence, profileId, provider, modelId, today, ops]
  );

  const send = useCallback(
    (text: string) => {
      if (!ctx || state === "streaming" || !text.trim()) return;
      lastInputRef.current = text;
      // Count-only: no message content reaches analytics (spec usage rule).
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

  return {
    state,
    streamingText,
    pendingAction,
    error,
    send,
    approve,
    deny,
    retry,
  };
};

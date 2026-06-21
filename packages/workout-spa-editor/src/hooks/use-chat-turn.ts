/**
 * useChatTurn — orchestrates one chat conversation: provider → model →
 * agent → streamed turn → persistence, plus the pending-action
 * confirm/deny resume. Thin wrapper over the testable `chat-turn-runner`
 * functions; components consume only the returned state + actions and never
 * touch the AI SDK or Dexie directly.
 */
import type { ChatAgent, ChatTool, PendingAction } from "@kaiord/ai";
import type { ModelMessage } from "ai";
import { useMemo, useRef, useState } from "react";

import { useAnalytics } from "../contexts/analytics-context";
import { usePersistence } from "../contexts/persistence-context";
import { type ChatTurnState, makeChatTurnCtx } from "./chat/chat-turn-types";
import { useChatActionOps } from "./use-chat-action-ops";
import { useChatTurnActions } from "./use-chat-turn-actions";
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

  const { profileId, conversationId, provider, modelId, today, messages } =
    args;
  const ctx = useMemo(
    () =>
      makeChatTurnCtx(
        {
          persistence,
          profileId,
          conversationId,
          provider,
          modelId,
          today,
          ops,
        },
        { agentRef, toolsRef, messagesRef },
        { setState, setStreamingText, setPendingAction, setError }
      ),
    [persistence, profileId, conversationId, provider, modelId, today, ops]
  );

  const actions = useChatTurnActions(
    ctx,
    state,
    messages,
    pendingAction,
    analytics
  );
  return { state, streamingText, pendingAction, error, ...actions };
};

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

import { usePersistence } from "../contexts/persistence-context";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";
import { approveAction, denyAction, sendTurn } from "./chat/chat-turn-runner";
import { type ChatTurnState, makeChatTurnCtx } from "./chat/chat-turn-types";
import { useChatActionOps } from "./use-chat-action-ops";

export type UseChatTurnArgs = {
  profileId: string | null;
  provider: LlmProviderConfig | null;
  modelId: string | null;
  generationProvider: LlmProviderConfig | null;
  generationModelId: string | null;
  today: string;
  messages: ChatMessageRecord[];
};

export type UseChatTurn = {
  state: ChatTurnState;
  streamingText: string;
  pendingAction: PendingAction | null;
  error: string | null;
  send: (text: string) => void;
  approve: () => void;
  deny: () => void;
  retry: () => void;
};

export const useChatTurn = (args: UseChatTurnArgs): UseChatTurn => {
  const persistence = usePersistence();
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
      void sendTurn(ctx, messages, text);
    },
    [ctx, state, messages]
  );
  const approve = useCallback(() => {
    if (ctx && pendingAction) void approveAction(ctx, pendingAction);
  }, [ctx, pendingAction]);
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

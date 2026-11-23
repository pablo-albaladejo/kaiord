/**
 * useChatTurn — orchestrates one chat conversation: provider → model →
 * agent → streamed turn → persistence, plus the pending-action
 * confirm/deny resume. Thin wrapper over the testable `chat-turn-runner`
 * functions; components consume only the returned state + actions and never
 * touch the AI SDK or Dexie directly.
 */
import type { ChatAgent, ChatTool, PendingAction } from "@kaiord/ai";
import type { ModelMessage } from "ai";
import { useRef, useState } from "react";

import type { TraceRun } from "../application/trace/trace-run";
import { useAnalytics } from "../contexts/analytics-context";
import { usePersistence } from "../contexts/persistence-context";
import { useUnsavedWork } from "../lib/use-unsaved-work";
import type { ChatTurnState } from "./chat/chat-turn-types";
import { useChatTurnCtx } from "./chat/use-chat-turn-ctx";
import { useStopTurnOnLeave } from "./chat/use-stop-turn-on-leave";
import { useChatActionOps } from "./use-chat-action-ops";
import { useChatTurnActions } from "./use-chat-turn-actions";
import type { UseChatTurn, UseChatTurnArgs } from "./use-chat-turn-types";

export const useChatTurn = (args: UseChatTurnArgs): UseChatTurn => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const traceRef = useRef<TraceRun | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ops = useChatActionOps(
    args.profileId,
    { provider: args.generationProvider, modelId: args.generationModelId },
    { traceRef, abortRef }
  );
  const [state, setState] = useState<ChatTurnState>("idle");
  const [streamingText, setStreamingText] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  useUnsavedWork(state === "streaming" || pendingAction !== null);
  const [error, setError] = useState<string | null>(null);
  const agentRef = useRef<ChatAgent | null>(null);
  const toolsRef = useRef<ChatTool[]>([]);
  const messagesRef = useRef<ModelMessage[]>([]);
  const disposedRef = useStopTurnOnLeave(abortRef, traceRef);
  const ctx = useChatTurnCtx(
    { ...args, persistence, ops },
    { agentRef, toolsRef, messagesRef, abortRef, disposedRef, traceRef },
    { setState, setStreamingText, setPendingAction, setError }
  );

  const actions = useChatTurnActions(
    ctx,
    state,
    args.messages,
    pendingAction,
    analytics
  );
  return { state, streamingText, pendingAction, error, ...actions };
};

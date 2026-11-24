import { useMemo } from "react";

import { useCapabilities } from "../../contexts/capabilities-context";
import {
  type ChatTurnCtx,
  type ChatTurnDeps,
  type ChatTurnRefs,
  type ChatTurnSetters,
  makeChatTurnCtx,
} from "./chat-turn-types";

/**
 * The turn context, rebuilt only when what the turn depends on changes (refs
 * and state setters are stable). It carries the read API's answer, so a turn
 * offers the assistant no Tool an off Capability owns.
 */
export const useChatTurnCtx = (
  deps: Omit<ChatTurnDeps, "offers">,
  refs: ChatTurnRefs,
  setters: ChatTurnSetters
): ChatTurnCtx | null => {
  const { offers } = useCapabilities();
  const { persistence, profileId, conversationId, provider, modelId } = deps;
  const { pinModel, today, ops } = deps;
  const { agentRef, toolsRef, messagesRef, abortRef, disposedRef, traceRef } =
    refs;
  const { setState, setStreamingText, setPendingAction, setError } = setters;
  return useMemo(
    () =>
      makeChatTurnCtx(
        {
          persistence,
          profileId,
          conversationId,
          provider,
          modelId,
          pinModel,
          today,
          ops,
          offers,
        },
        { agentRef, toolsRef, messagesRef, abortRef, disposedRef, traceRef },
        { setState, setStreamingText, setPendingAction, setError }
      ),
    [
      persistence,
      profileId,
      conversationId,
      provider,
      modelId,
      pinModel,
      today,
      ops,
      offers,
      agentRef,
      toolsRef,
      messagesRef,
      abortRef,
      disposedRef,
      traceRef,
      setState,
      setStreamingText,
      setPendingAction,
      setError,
    ]
  );
};

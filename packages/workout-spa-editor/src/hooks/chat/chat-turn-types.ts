/**
 * Context types and factory for the chat turn runner. Split from the engine
 * (`chat-turn-context`) so each file stays under the line cap.
 */
import type { ChatAgent, ChatTool, PendingAction } from "@kaiord/ai";
import type { ModelMessage } from "ai";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { ChatActionOps } from "../../application/chat/tools/chat-tool-deps";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";

export type ChatTurnState =
  "idle" | "streaming" | "awaiting_confirmation" | "error";

export type ChatTurnSetters = {
  setState: (s: ChatTurnState) => void;
  setStreamingText: Dispatch<SetStateAction<string>>;
  setPendingAction: (p: PendingAction | null) => void;
  setError: (e: string | null) => void;
};

export type ChatTurnRefs = {
  agentRef: MutableRefObject<ChatAgent | null>;
  toolsRef: MutableRefObject<ChatTool[]>;
  messagesRef: MutableRefObject<ModelMessage[]>;
  /** The in-flight turn's controller; aborting it stops the turn. */
  abortRef: MutableRefObject<AbortController | null>;
  /** True once the conversation is left; a turn started after it (a
   * resume once its confirmed tool finishes) is aborted at once. */
  disposedRef: MutableRefObject<boolean>;
};

export type ChatTurnDeps = {
  persistence: PersistencePort;
  profileId: string | null;
  conversationId: string | null;
  provider: LlmProviderConfig | null;
  modelId: string | null;
  /** Stamp the model on a new conversation: true when the draft chose it. */
  pinModel: boolean;
  today: string;
  ops: ChatActionOps;
};

export type ChatTurnCtx = Omit<
  ChatTurnDeps,
  "profileId" | "conversationId" | "provider" | "modelId"
> &
  ChatTurnRefs & {
    profileId: string;
    conversationId: string;
    provider: LlmProviderConfig;
    modelId: string;
    set: {
      state: (s: ChatTurnState) => void;
      streamingText: Dispatch<SetStateAction<string>>;
      pendingAction: (p: PendingAction | null) => void;
      error: (e: string | null) => void;
    };
  };

export const makeChatTurnCtx = (
  deps: ChatTurnDeps,
  refs: ChatTurnRefs,
  setters: ChatTurnSetters
): ChatTurnCtx | null => {
  if (
    !deps.profileId ||
    !deps.conversationId ||
    !deps.provider ||
    !deps.modelId
  )
    return null;
  return {
    persistence: deps.persistence,
    profileId: deps.profileId,
    conversationId: deps.conversationId,
    provider: deps.provider,
    modelId: deps.modelId,
    pinModel: deps.pinModel,
    today: deps.today,
    ops: deps.ops,
    ...refs,
    set: {
      state: setters.setState,
      streamingText: setters.setStreamingText,
      pendingAction: setters.setPendingAction,
      error: setters.setError,
    },
  };
};

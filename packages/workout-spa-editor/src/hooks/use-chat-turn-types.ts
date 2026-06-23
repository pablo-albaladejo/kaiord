/**
 * Public arg + return types for `useChatTurn`, split out so the hook file
 * stays under the per-file line cap.
 */
import type { PendingAction } from "@kaiord/ai";

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";
import type { ChatTurnState } from "./chat/chat-turn-types";

export type UseChatTurnArgs = {
  profileId: string | null;
  conversationId: string | null;
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

import { useChatTurn } from "../../../hooks/use-chat-turn";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatTurnExtras } from "./ChatTurnExtras";

export type ChatConversationProps = {
  profileId: string | null;
  conversationId: string | null;
  provider: LlmProviderConfig | null;
  modelId: string | null;
  generationProvider: LlmProviderConfig | null;
  generationModelId: string | null;
  messages: ChatMessageRecord[];
  focusMessageId?: string | null;
};

/** Interactive transcript for the active conversation: streamed turns, action
 * confirmation, and errors. The composer is disabled while a turn is in flight
 * or awaiting confirmation. Conversation lifecycle (new/rename/delete) lives in
 * the conversation list. */
export function ChatConversation({
  profileId,
  conversationId,
  provider,
  modelId,
  generationProvider,
  generationModelId,
  messages,
  focusMessageId,
}: ChatConversationProps) {
  const turn = useChatTurn({
    profileId,
    conversationId,
    provider,
    modelId,
    generationProvider,
    generationModelId,
    today: todayIsoDate(),
    messages,
  });
  const busy = turn.state === "streaming";

  return (
    <div className="flex flex-col gap-3">
      <ChatMessageList messages={messages} focusMessageId={focusMessageId} />
      <ChatTurnExtras
        busy={busy}
        streamingText={turn.streamingText}
        pendingAction={turn.pendingAction}
        error={turn.error}
        onApprove={turn.approve}
        onDeny={turn.deny}
        onRetry={turn.retry}
      />
      <ChatComposer
        onSend={turn.send}
        disabled={busy || turn.state === "awaiting_confirmation"}
      />
    </div>
  );
}

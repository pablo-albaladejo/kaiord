import { useState } from "react";

import { clearConversation } from "../../../application/chat/clear-conversation";
import { usePersistence } from "../../../contexts/persistence-context";
import { useChatTurn } from "../../../hooks/use-chat-turn";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatTurnExtras } from "./ChatTurnExtras";

export type ChatConversationProps = {
  profileId: string | null;
  provider: LlmProviderConfig | null;
  modelId: string | null;
  generationProvider: LlmProviderConfig | null;
  generationModelId: string | null;
  messages: ChatMessageRecord[];
};

/** Interactive transcript: streamed turns, action confirmation, errors, and
 * a two-step clear. The composer is disabled while a turn is in flight or
 * awaiting confirmation. */
export function ChatConversation({
  profileId,
  provider,
  modelId,
  generationProvider,
  generationModelId,
  messages,
}: ChatConversationProps) {
  const persistence = usePersistence();
  const turn = useChatTurn({
    profileId,
    provider,
    modelId,
    generationProvider,
    generationModelId,
    today: todayIsoDate(),
    messages,
  });
  const [confirmingClear, setConfirmingClear] = useState(false);
  const busy = turn.state === "streaming";

  const clear = () => {
    if (!profileId) return;
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    setConfirmingClear(false);
    void clearConversation(persistence, profileId);
  };

  return (
    <div className="flex flex-col gap-3">
      {messages.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="self-end text-[12px] text-slate-400 hover:text-slate-200"
        >
          {confirmingClear ? "Confirm clear" : "Clear conversation"}
        </button>
      )}
      <ChatMessageList messages={messages} />
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

import { useState } from "react";

import { clearConversation } from "../../../application/chat/clear-conversation";
import { usePersistence } from "../../../contexts/persistence-context";
import { useChatTurn } from "../../../hooks/use-chat-turn";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { ChatComposer } from "./ChatComposer";
import { ChatErrorNotice } from "./ChatErrorNotice";
import { ChatMessageList } from "./ChatMessageList";
import { PendingActionCard } from "./PendingActionCard";

export type ChatConversationProps = {
  profileId: string | null;
  provider: LlmProviderConfig | null;
  messages: ChatMessageRecord[];
};

/** Interactive transcript: streamed turns, action confirmation, errors, and
 * a two-step clear. The composer is disabled while a turn is in flight or
 * awaiting confirmation. */
export function ChatConversation({
  profileId,
  provider,
  messages,
}: ChatConversationProps) {
  const persistence = usePersistence();
  const turn = useChatTurn({
    profileId,
    provider,
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
      {busy && turn.streamingText !== "" && (
        <p className="max-w-[80%] self-start whitespace-pre-wrap rounded-2xl bg-slate-800 px-3 py-2 text-[14px] text-slate-50">
          {turn.streamingText}
        </p>
      )}
      {turn.pendingAction && (
        <PendingActionCard
          action={turn.pendingAction}
          onApprove={turn.approve}
          onDeny={turn.deny}
          busy={busy}
        />
      )}
      {turn.error !== null && (
        <ChatErrorNotice message={turn.error} onRetry={turn.retry} />
      )}
      <ChatComposer
        onSend={turn.send}
        disabled={busy || turn.state === "awaiting_confirmation"}
      />
    </div>
  );
}

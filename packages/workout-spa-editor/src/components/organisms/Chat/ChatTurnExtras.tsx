import type { PendingAction } from "@kaiord/ai";

import { ChatErrorNotice } from "./ChatErrorNotice";
import { PendingActionCard } from "./PendingActionCard";

export type ChatTurnExtrasProps = {
  busy: boolean;
  streamingText: string;
  pendingAction: PendingAction | null;
  error: string | null;
  onApprove: () => void;
  onDeny: () => void;
  onRetry: () => void;
};

/** Transient turn UI below the transcript: the in-flight streamed bubble,
 * the pending-action confirmation card, and the error notice. */
export function ChatTurnExtras({
  busy,
  streamingText,
  pendingAction,
  error,
  onApprove,
  onDeny,
  onRetry,
}: ChatTurnExtrasProps) {
  return (
    <>
      {busy && streamingText !== "" && (
        <p className="max-w-[80%] self-start whitespace-pre-wrap rounded-2xl bg-surface px-3 py-2 text-[14px] text-ink-strong">
          {streamingText}
        </p>
      )}
      {pendingAction && (
        <PendingActionCard
          action={pendingAction}
          onApprove={onApprove}
          onDeny={onDeny}
          busy={busy}
        />
      )}
      {error !== null && <ChatErrorNotice category={error} onRetry={onRetry} />}
    </>
  );
}

import { Button } from "../../atoms/Button";

export type ChatErrorNoticeProps = {
  message: string;
  onRetry: () => void;
};

/** In-conversation error entry with a retry affordance. `message` is a
 * fixed category string (never conversation content), per the PII guard. */
export function ChatErrorNotice({ message, onRetry }: ChatErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-2xl border border-rose-600/40 bg-rose-950/20 px-3 py-2"
    >
      <span className="text-[13px] text-rose-200">{message}</span>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}

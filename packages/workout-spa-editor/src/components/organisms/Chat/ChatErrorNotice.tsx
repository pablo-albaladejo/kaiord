import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type ChatErrorNoticeProps = {
  category: string;
  onRetry: () => void;
};

/** In-conversation error entry with a retry affordance. `category` is a stable
 * error-category key (never conversation content), localized here by that key
 * so raw error text is never rendered, per the PII guard. */
export function ChatErrorNotice({ category, onRetry }: ChatErrorNoticeProps) {
  const t = useTranslate("chat");
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-2xl border border-rose-600/40 bg-rose-950/20 px-3 py-2"
    >
      <span className="text-[13px] text-rose-200">
        {t(`errors.${category}`)}
      </span>
      <Button onClick={onRetry}>{t("errors.retry")}</Button>
    </div>
  );
}

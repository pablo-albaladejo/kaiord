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
      className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-3 py-2 dark:border-rose-800 dark:bg-rose-950/30"
    >
      <span className="text-[13px] text-rose-700 dark:text-rose-300">
        {t(`errors.${category}`)}
      </span>
      <Button onClick={onRetry}>{t("errors.retry")}</Button>
    </div>
  );
}

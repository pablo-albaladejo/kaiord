/**
 * Error + retry state for the coaching activity description. Shown when the
 * lazy `read-day` fetch fails, so the dialog no longer hangs indefinitely on
 * "Loading description…". The message is reason-specific; the button re-fires
 * the fetch.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { ExpandFailureReason } from "../../../types/coaching-expand-result";

export const DialogDescriptionError = ({
  reason,
  onRetry,
}: {
  reason: ExpandFailureReason;
  onRetry: () => void;
}) => {
  const t = useTranslate("coaching");
  return (
    <div
      data-testid="coaching-dialog-description-error"
      className="space-y-1 text-xs"
    >
      <p className="italic text-rose-600 dark:text-rose-400">
        {t(`dialog.descriptionError.${reason}`)}
      </p>
      <button
        type="button"
        data-testid="coaching-dialog-description-retry"
        onClick={onRetry}
        className="font-medium text-primary underline"
      >
        {t("dialog.retryDescription")}
      </button>
    </div>
  );
};

/**
 * Error + retry state for the coaching activity description. Shown when the
 * lazy `read-day` fetch fails, so the dialog no longer hangs indefinitely on
 * "Loading description…". A failure of the Train2Go Connection is its own
 * notice with its one fix (sign in, or try again, which re-fires the fetch);
 * an unlinked coach keeps its sentence and the retry. A part of the App that
 * did not load is the App's own failure: Train2Go was never asked, and a
 * reload fetches that part again.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { ExpandFailureReason } from "../../../types/coaching-expand-result";
import { PlatformConnectionNotice } from "../ConnectionNotice/PlatformConnectionNotice";
import { ReloadAppButton } from "../ReloadAppButton";

const TEST_ID = "coaching-dialog-description-error";

export const DialogDescriptionError = ({
  reason,
  onRetry,
}: {
  reason: ExpandFailureReason;
  onRetry: () => void;
}) => {
  const t = useTranslate("coaching");
  if (reason === "app-part-not-loaded") {
    return (
      <div data-testid={TEST_ID} className="space-y-1 text-xs">
        <p className="text-danger-text" role="status">
          {t("dialog.descriptionError.app-part-not-loaded")}
        </p>
        <ReloadAppButton />
      </div>
    );
  }
  if (reason !== "not-linked") {
    return (
      <PlatformConnectionNotice
        bridgeId="train2go-bridge"
        platform="Train2Go"
        connection={
          reason === "session-expired" ? "signed-out" : "not-answering"
        }
        onRetry={onRetry}
        testId={TEST_ID}
      />
    );
  }
  return (
    <div data-testid={TEST_ID} className="space-y-1 text-xs">
      <p className="italic text-danger-text">
        {t("dialog.descriptionError.not-linked")}
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

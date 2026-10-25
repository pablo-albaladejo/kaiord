import { useState } from "react";

import type { TrainingPeaksPushOutcome } from "../../../hooks/use-trainingpeaks-push";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../ConfirmationModal";

export type TrainingPeaksPushFailure = Exclude<
  TrainingPeaksPushOutcome,
  { ok: true }
>;

export type TrainingPeaksPushFeedbackProps = {
  failure: TrainingPeaksPushFailure;
  onSendCopy: () => void;
};

const ERROR_CLASS = "text-xs text-[var(--danger-text)]";

/** The refusal message, or the re-push block and its "send a copy" override. */
export const TrainingPeaksPushFeedback = ({
  failure,
  onSendCopy,
}: TrainingPeaksPushFeedbackProps) => {
  const t = useTranslate("workout-detail");
  const [confirming, setConfirming] = useState(false);
  if (!("block" in failure)) {
    return (
      <span className={ERROR_CLASS} data-testid="trainingpeaks-push-error">
        {failure.message}
      </span>
    );
  }
  const { block } = failure;
  const message =
    block.reason === "moved"
      ? t("footer.trainingPeaksRepush.moved", { date: block.recordedDate })
      : t("footer.trainingPeaksRepush.changed");

  return (
    <>
      <span className={ERROR_CLASS} data-testid="trainingpeaks-repush-blocked">
        {message}
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setConfirming(true)}
        data-testid="trainingpeaks-send-copy-button"
      >
        {t("footer.trainingPeaksRepush.sendCopy")}
      </Button>
      <ConfirmationModal
        isOpen={confirming}
        title={t("footer.trainingPeaksRepush.confirmTitle")}
        message={t("footer.trainingPeaksRepush.confirmMessage")}
        confirmLabel={t("footer.trainingPeaksRepush.confirmSend")}
        cancelLabel={t("footer.trainingPeaksRepush.cancel")}
        onConfirm={() => {
          setConfirming(false);
          onSendCopy();
        }}
        onCancel={() => setConfirming(false)}
        variant="default"
      />
    </>
  );
};

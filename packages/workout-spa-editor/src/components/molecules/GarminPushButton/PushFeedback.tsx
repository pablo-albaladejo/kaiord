import type { PushState } from "../../../contexts";
import type { GarminPushFailure } from "../../../contexts/garmin-bridge-types";
import { useTranslate } from "../../../i18n/use-translate";

type PushFeedbackProps = {
  push: PushState;
  onReset: () => void;
};

const FAILURE_KEYS: Record<GarminPushFailure, string> = {
  updated: "footer.garminPushError.updated",
  "sign-in": "footer.garminPushError.signIn",
  "not-prepared": "footer.garminPushError.notPrepared",
  "not-answering": "footer.garminPushError.notAnswering",
};

/* Success left the palette along with warning: a green tick borrowed a hue
   the training zones own. The outcome is said in words instead. Failure
   keeps the one ramp allowed to mean danger. */
export const PushFeedback: React.FC<PushFeedbackProps> = ({
  push,
  onReset,
}) => {
  const t = useTranslate("workout-detail");

  if (push.status === "success") {
    return (
      <button
        type="button"
        className="text-xs text-ink-muted"
        onClick={onReset}
      >
        {t("footer.sent")}
      </button>
    );
  }

  if (push.status === "error") {
    return (
      <span className="text-xs text-[var(--danger-text)]">
        {t(FAILURE_KEYS[push.reason])}
      </span>
    );
  }

  return null;
};

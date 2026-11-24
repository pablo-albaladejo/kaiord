import type { ConnectionState } from "../../../application/connections/connection-state";
import type { PushState } from "../../../contexts";
import type { GarminPushFailure } from "../../../contexts/garmin-bridge-types";
import { useTranslate } from "../../../i18n/use-translate";
import { GarminConnectionNotice } from "../ConnectionNotice/GarminConnectionNotice";
import { ReloadAppButton } from "./ReloadAppButton";

type PushFeedbackProps = {
  push: PushState;
  onReset: () => void;
};

/** A failure of the Connection is its notice; an extension that was updated
    mid-send did not answer, which is "not-answering". A workout that could
    not be converted, or a send the App could not load, is the App's own
    failure: Garmin was never asked. */
const CONNECTION_OF: Record<
  Exclude<GarminPushFailure, "not-prepared" | "not-loaded">,
  ConnectionState
> = {
  updated: "not-answering",
  "sign-in": "signed-out",
  "not-answering": "not-answering",
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

  if (push.status !== "error") return null;
  if (push.reason === "not-prepared") {
    return (
      <span className="text-xs text-[var(--danger-text)]">
        {t("footer.garminPushError.notPrepared")}
      </span>
    );
  }
  if (push.reason === "not-loaded") {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-[var(--danger-text)]" role="status">
          {t("footer.garminPushError.notLoaded")}
        </span>
        <ReloadAppButton />
      </span>
    );
  }
  return <GarminConnectionNotice connection={CONNECTION_OF[push.reason]} />;
};

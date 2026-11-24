import type { ConnectionState } from "../../../application/connections/connection-state";
import type { TrainingPeaksPushRefusal } from "../../../hooks/trainingpeaks-push-failure";
import { useTranslate } from "../../../i18n/use-translate";
import { PlatformConnectionNotice } from "../ConnectionNotice/PlatformConnectionNotice";

const ERROR_CLASS = "text-xs text-[var(--danger-text)]";

/** The send's own refusals; every other refusal is the Connection's notice. */
const REFUSAL_KEYS: Partial<Record<TrainingPeaksPushRefusal, string>> = {
  horizon: "footer.trainingPeaksHorizon.refused",
  "no-steps": "footer.trainingPeaksPushError.noSteps",
};

const CONNECTION_OF: Partial<
  Record<TrainingPeaksPushRefusal, ConnectionState>
> = {
  "not-answering": "not-answering",
  install: "not-installed",
  "sign-in": "signed-out",
};

/** A refusal: the Connection's notice, or the send's own sentence. */
export const TrainingPeaksRefusal = ({
  reason,
}: {
  reason: TrainingPeaksPushRefusal;
}) => {
  const t = useTranslate("workout-detail");
  const connection = CONNECTION_OF[reason];
  if (connection !== undefined) {
    return (
      <PlatformConnectionNotice
        bridgeId="trainingpeaks-bridge"
        platform="TrainingPeaks"
        connection={connection}
        testId="trainingpeaks-push-error"
      />
    );
  }
  return (
    <span className={ERROR_CLASS} data-testid="trainingpeaks-push-error">
      {t(REFUSAL_KEYS[reason] ?? "footer.trainingPeaksPushError.noSteps")}
    </span>
  );
};

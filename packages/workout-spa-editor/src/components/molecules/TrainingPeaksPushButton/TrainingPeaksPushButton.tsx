import { forwardRef, useCallback, useState } from "react";

import { useTrainingPeaksPush } from "../../../hooks/use-trainingpeaks-push";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button, type ButtonSize } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { TrainingPeaksSentButton } from "./TrainingPeaksSentButton";

/**
 * Sends a workout to the athlete's TrainingPeaks calendar.
 *
 * A sibling of `PushButton` rather than a parameterisation of it: that one is
 * welded to `useGarminBridge`'s shared pushing state and to the ribbon's
 * Garmin gate, and prising those apart would change the shipped Garmin path
 * for no gain here.
 *
 * It also differs in one deliberate way — `PushButton` swallows a failure back
 * to idle, which would hide the message that matters most on this destination:
 * TrainingPeaks refuses any date beyond the account's planning horizon, and the
 * athlete needs to read that rather than watch a button do nothing.
 */
type PushStatus = "idle" | "pushing" | "done";

export type TrainingPeaksPushButtonProps = {
  workout: WorkoutRecord | undefined;
  full?: boolean;
  size?: Extract<ButtonSize, "md" | "lg">;
  onSent?: () => void;
};

export const TrainingPeaksPushButton = forwardRef<
  HTMLButtonElement,
  TrainingPeaksPushButtonProps
>(({ workout, full = false, size = "md", onSent }, ref) => {
  const t = useTranslate("workout-detail");
  const { push } = useTrainingPeaksPush(workout);
  const [status, setStatus] = useState<PushStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const widthClass = full ? "w-full" : "";

  const handlePush = useCallback(async () => {
    setStatus("pushing");
    setError(null);
    const outcome = await push();
    if (outcome.ok) {
      setStatus("done");
      onSent?.();
      return;
    }
    setStatus("idle");
    setError(outcome.message);
  }, [push, onSent]);

  if (status === "done") {
    return (
      <TrainingPeaksSentButton ref={ref} size={size} className={widthClass} />
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        ref={ref}
        size={size}
        variant="primary"
        loading={status === "pushing"}
        disabled={status === "pushing"}
        onClick={handlePush}
        className={widthClass}
        data-testid="send-to-trainingpeaks-button"
      >
        <Icon icon={ICON_MAP.upload} size="sm" color="inherit" />
        {status === "pushing"
          ? t("footer.sending")
          : t("footer.sendToTrainingPeaks")}
      </Button>
      {error !== null && (
        <span
          className="text-xs text-[var(--danger-text)]"
          data-testid="trainingpeaks-push-error"
        >
          {error}
        </span>
      )}
    </div>
  );
});

TrainingPeaksPushButton.displayName = "TrainingPeaksPushButton";

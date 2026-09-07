import { forwardRef } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button, type ButtonSize } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

/* Done is stated, not coloured — a green tick would borrow a hue the training
   zones own, the same reason PushButton says it in words. */
export const TrainingPeaksSentButton = forwardRef<
  HTMLButtonElement,
  { size: Extract<ButtonSize, "md" | "lg">; className: string }
>(({ size, className }, ref) => {
  const t = useTranslate("workout-detail");
  return (
    <Button
      ref={ref}
      size={size}
      variant="secondary"
      disabled
      className={className}
      data-testid="send-to-trainingpeaks-button"
    >
      <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
      {t("footer.sentToTrainingPeaks")}
    </Button>
  );
});

TrainingPeaksSentButton.displayName = "TrainingPeaksSentButton";

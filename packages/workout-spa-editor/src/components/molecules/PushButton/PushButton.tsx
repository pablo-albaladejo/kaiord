import { forwardRef, useCallback, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button, type ButtonSize } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { useGarminPush } from "../GarminPushButton/useGarminPush";

type PushStatus = "idle" | "pushing" | "done";

export type PushButtonProps = {
  workout: WorkoutRecord | undefined;
  full?: boolean;
  size?: Extract<ButtonSize, "md" | "lg">;
};

export const PushButton = forwardRef<HTMLButtonElement, PushButtonProps>(
  ({ workout, full = false, size = "md" }, ref) => {
    const t = useTranslate("workout-detail");
    const { push } = useGarminPush(workout);
    const [status, setStatus] = useState<PushStatus>("idle");
    const widthClass = full ? "w-full" : "";

    const handlePush = useCallback(async () => {
      setStatus("pushing");
      try {
        setStatus((await push()) ? "done" : "idle");
      } catch {
        setStatus("idle");
      }
    }, [push]);

    // Done is stated, not coloured: the emerald pill borrowed a hue that
    // belongs to zone 3, and success is not part of this palette.
    if (status === "done") {
      return (
        <Button
          ref={ref}
          size={size}
          variant="secondary"
          disabled
          className={widthClass}
        >
          <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
          {t("footer.sent")}
        </Button>
      );
    }

    if (status === "pushing") {
      return (
        <Button
          ref={ref}
          size={size}
          variant="primary"
          loading
          disabled
          className={widthClass}
        >
          {t("footer.sending")}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        size={size}
        variant="primary"
        onClick={handlePush}
        className={widthClass}
      >
        <Icon icon={ICON_MAP.watch} size="sm" color="inherit" />
        {t("footer.send")}
      </Button>
    );
  }
);

PushButton.displayName = "PushButton";

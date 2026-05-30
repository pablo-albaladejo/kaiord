import { forwardRef, useCallback, useState } from "react";

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

const DONE_CLASSES =
  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/15";

export const PushButton = forwardRef<HTMLButtonElement, PushButtonProps>(
  ({ workout, full = false, size = "md" }, ref) => {
    const { push } = useGarminPush(workout);
    const [status, setStatus] = useState<PushStatus>("idle");
    const widthClass = full ? "w-full" : "";

    const handlePush = useCallback(async () => {
      setStatus("pushing");
      try {
        await push();
        setStatus("done");
      } catch {
        setStatus("idle");
      }
    }, [push]);

    if (status === "done") {
      return (
        <Button
          ref={ref}
          size={size}
          variant="soft"
          disabled
          className={[DONE_CLASSES, widthClass].filter(Boolean).join(" ")}
        >
          <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
          On your Garmin
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
          Pushing…
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
        Push to Garmin
      </Button>
    );
  }
);

PushButton.displayName = "PushButton";

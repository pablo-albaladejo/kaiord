import { type ButtonHTMLAttributes, forwardRef, type MouseEvent } from "react";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useGarminPushTo } from "../../molecules/GarminPushButton/useGarminPush";

const ACTION_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20";

const movedOnCalendar = (result: PlacementResult | undefined) =>
  result?.kind === "scheduled" ||
  result?.kind === "moved" ||
  result?.kind === "unchanged";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  workout: WorkoutRecord;
};

/**
 * The post-move toast's Update Garmin. It renders inside the toast region,
 * under the app's bridge provider, so it owns the push; the toast primitive
 * passes its own props and ref through (`asChild`).
 */
export const UpdateGarminToastAction = forwardRef<HTMLButtonElement, Props>(
  ({ workout, onClick, ...rest }, ref) => {
    const t = useTranslate("calendar");
    const toast = useToastContext();
    const pushTo = useGarminPushTo();
    const update = async () => {
      const result = await pushTo(workout).catch(() => undefined);
      if (movedOnCalendar(result)) toast.success(t("garminDrift.updated"));
      else toast.warning(t("garminDrift.notUpdated"));
    };
    return (
      <button
        {...rest}
        ref={ref}
        type="button"
        className={ACTION_CLASS}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          void update();
        }}
      >
        {t("garminDrift.update")}
      </button>
    );
  }
);

UpdateGarminToastAction.displayName = "UpdateGarminToastAction";

import {
  type ButtonHTMLAttributes,
  forwardRef,
  type MouseEvent,
  useId,
} from "react";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import {
  UPDATE_GARMIN_REASON_KEY,
  useUpdateGarminReason,
} from "../../molecules/GarminDriftBadge/use-update-garmin-reason";
import { useGarminPushTo } from "../../molecules/GarminPushButton/useGarminPush";
import { readPushableWorkout } from "./read-pushable-workout";

const ACTION_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:pointer-events-none disabled:opacity-50";

const movedOnCalendar = (result: PlacementResult | undefined) =>
  result?.kind === "scheduled" ||
  result?.kind === "moved" ||
  result?.kind === "unchanged";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  workoutId: string;
};

/**
 * The post-move toast's Update Garmin. It renders inside the toast region,
 * under the app's persistence and bridge providers, so it owns the push; the
 * toast primitive passes its own props and ref through (`asChild`). The
 * press may come minutes after the move, so it pushes the row as stored
 * then, and does nothing when that row is gone, locked or already in sync.
 * While the bridge cannot move it, the button is disabled with the reason.
 */
export const UpdateGarminToastAction = forwardRef<HTMLButtonElement, Props>(
  ({ workoutId, onClick, ...rest }, ref) => {
    const t = useTranslate("calendar");
    const tDetail = useTranslate("workout-detail");
    const toast = useToastContext();
    const persistence = usePersistence();
    const pushTo = useGarminPushTo();
    const reason = useUpdateGarminReason();
    const reasonId = useId();
    const update = async () => {
      let result: PlacementResult | undefined;
      try {
        const workout = await readPushableWorkout(persistence, workoutId);
        if (!workout) return;
        result = await pushTo(workout);
      } catch {
        result = undefined;
      }
      if (movedOnCalendar(result)) toast.success(t("garminDrift.updated"));
      else toast.warning(t("garminDrift.notUpdated"));
    };
    if (reason)
      return (
        <span className="flex max-w-[14rem] flex-col items-end gap-1">
          <button
            type="button"
            disabled
            aria-describedby={reasonId}
            className={ACTION_CLASS}
          >
            {t("garminDrift.update")}
          </button>
          <span id={reasonId} className="text-right text-xs opacity-90">
            {tDetail(UPDATE_GARMIN_REASON_KEY[reason])}
          </span>
        </span>
      );
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

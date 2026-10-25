import { type ButtonHTMLAttributes, forwardRef, type MouseEvent } from "react";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import { readSessionMovability } from "../../../application/read-session-movability";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { PersistencePort } from "../../../ports/persistence-port";
import { useGarminPushTo } from "../../molecules/GarminPushButton/useGarminPush";

const ACTION_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20";

const movedOnCalendar = (result: PlacementResult | undefined) =>
  result?.kind === "scheduled" ||
  result?.kind === "moved" ||
  result?.kind === "unchanged";

/** The row as stored now, or `undefined` when gone or locked. */
const readMovable = async (persistence: PersistencePort, workoutId: string) => {
  const workout = await persistence.workouts.getById(workoutId);
  if (!workout) return undefined;
  const { movable } = await readSessionMovability(
    persistence,
    workout.profileId,
    workout
  );
  return movable ? workout : undefined;
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  workoutId: string;
};

/**
 * The post-move toast's Update Garmin. It renders inside the toast region,
 * under the app's persistence and bridge providers, so it owns the push; the toast primitive
 * passes its own props and ref through (`asChild`). The press may come
 * minutes after the move, so it pushes the row as stored then, and does
 * nothing when that row is gone or can no longer move.
 */
export const UpdateGarminToastAction = forwardRef<HTMLButtonElement, Props>(
  ({ workoutId, onClick, ...rest }, ref) => {
    const t = useTranslate("calendar");
    const toast = useToastContext();
    const persistence = usePersistence();
    const pushTo = useGarminPushTo();
    const update = async () => {
      let result: PlacementResult | undefined;
      try {
        const workout = await readMovable(persistence, workoutId);
        if (!workout) return;
        result = await pushTo(workout);
      } catch {
        result = undefined;
      }
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

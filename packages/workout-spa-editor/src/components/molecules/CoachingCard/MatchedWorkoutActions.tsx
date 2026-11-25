/**
 * The matched-workout bar with its two confirmations: Regenerate asks first
 * when the athlete edited the Workout by hand or it is on the watch, and
 * Delete workout always asks, naming Garmin when the Workout is placed
 * there. Delete removes the Workout and its Match (Undo brings both back),
 * so the Activity goes back to "To prepare".
 */
import { useState } from "react";

import { regenerateWarnings } from "../../../application/coaching/regenerate-warnings";
import { useGarminLedgerRow } from "../../../hooks/use-garmin-ledger-row";
import { useDeleteWorkoutWithUndo } from "../../pages/WorkoutDetail/use-delete-workout-with-undo";
import { MatchedActions, type MatchedActionsProps } from "./MatchedActions";
import { MatchedWorkoutConfirms } from "./MatchedWorkoutConfirms";

export type MatchedWorkoutActionsProps = Omit<MatchedActionsProps, "onDelete">;

const stay = () => undefined;

export function MatchedWorkoutActions(props: MatchedWorkoutActionsProps) {
  const { workout } = props;
  const [open, setOpen] = useState<"regenerate" | "delete" | null>(null);
  const onGarmin = useGarminLedgerRow(workout.id) !== undefined;
  const warnings = regenerateWarnings(workout, onGarmin);
  const deleteWithUndo = useDeleteWorkoutWithUndo(stay);
  const requestRegenerate = () =>
    warnings.edited || warnings.onWatch
      ? setOpen("regenerate")
      : props.onRegenerate();
  return (
    <>
      <MatchedActions
        {...props}
        onRegenerate={requestRegenerate}
        onDelete={() => setOpen("delete")}
      />
      <MatchedWorkoutConfirms
        open={open}
        warnings={warnings}
        onGarmin={onGarmin}
        onCancel={() => setOpen(null)}
        onRegenerate={() => {
          setOpen(null);
          props.onRegenerate();
        }}
        onDelete={() => {
          setOpen(null);
          void deleteWithUndo(workout);
        }}
      />
    </>
  );
}

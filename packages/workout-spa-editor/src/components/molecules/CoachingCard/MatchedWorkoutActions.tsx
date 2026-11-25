/**
 * The matched-workout bar with its two confirmations: Regenerate asks first
 * when the athlete edited the Workout by hand or it is on the watch, and
 * Delete workout always asks, naming Garmin when the Workout is placed
 * there. Delete removes the Workout and its Match (Undo brings both back),
 * so the Activity goes back to "To prepare".
 */
import { regenerateWarnings } from "../../../application/coaching/regenerate-warnings";
import { useGarminLedgerRow } from "../../../hooks/use-garmin-ledger-row";
import { useDeleteWorkoutWithUndo } from "../../pages/WorkoutDetail/use-delete-workout-with-undo";
import { MatchedActions, type MatchedActionsProps } from "./MatchedActions";
import { MatchedWorkoutConfirms } from "./MatchedWorkoutConfirms";
import { useMatchedConfirm } from "./use-coaching-dialog-state";

export type MatchedWorkoutActionsProps = Omit<MatchedActionsProps, "onDelete">;

/** A delete from the dialog leaves the athlete where they are. */
const stayInDialog = () => undefined;

export function MatchedWorkoutActions(props: MatchedWorkoutActionsProps) {
  const { workout } = props;
  const confirm = useMatchedConfirm();
  const onGarmin = useGarminLedgerRow(workout.id) !== undefined;
  const warnings = regenerateWarnings(workout, onGarmin);
  const deleteWithUndo = useDeleteWorkoutWithUndo(stayInDialog);
  const requestRegenerate = () =>
    warnings.edited || warnings.onWatch
      ? confirm.ask("regenerate")
      : props.onRegenerate();
  return (
    <>
      <MatchedActions
        {...props}
        onRegenerate={requestRegenerate}
        onDelete={() => confirm.ask("delete")}
      />
      <MatchedWorkoutConfirms
        open={confirm.open}
        warnings={warnings}
        onGarmin={onGarmin}
        onCancel={confirm.close}
        onRegenerate={() => {
          confirm.close();
          props.onRegenerate();
        }}
        onDelete={() => {
          confirm.close();
          void deleteWithUndo(workout);
        }}
      />
    </>
  );
}

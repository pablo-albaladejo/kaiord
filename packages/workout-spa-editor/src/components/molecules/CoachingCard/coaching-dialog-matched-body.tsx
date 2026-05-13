/**
 * Matched-state body renderer for `CoachingActivityDialog`. Split out
 * from `coaching-dialog-body.tsx` so the shared body file stays under
 * the per-file line cap with both `LinkedWorkoutSection` and the new
 * `ExecutedWorkoutsSection` slots wired up.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingDialogBodyProps } from "./coaching-dialog-body-props";
import { ExecutedWorkoutsSection } from "./ExecutedWorkoutsSection";
import { LinkedWorkoutSection } from "./LinkedWorkoutSection";
import { MatchedActions } from "./MatchedActions";

export const renderMatchedBody = (
  props: CoachingDialogBodyProps,
  workout: WorkoutRecord,
  executed: WorkoutRecord[]
) => (
  <>
    <LinkedWorkoutSection
      workout={workout}
      splitting={false}
      onSplit={() => undefined}
    />
    {executed.length > 0 ? (
      <ExecutedWorkoutsSection
        executed={executed}
        onOpenExecuted={props.onOpenExecuted}
      />
    ) : null}
    <MatchedActions
      workout={workout}
      splitting={props.splitting}
      onClose={props.onClose}
      onOpenEditor={props.onOpenEditor}
      onAiProcess={props.onAiProcess}
      onPushToGarmin={props.onPushToGarmin}
      onSplit={props.onSplit}
    />
  </>
);

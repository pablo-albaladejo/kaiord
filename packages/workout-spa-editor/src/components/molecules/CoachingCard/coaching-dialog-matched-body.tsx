/**
 * Matched-state body renderer for `CoachingActivityDialog`. Split out
 * from `coaching-dialog-body.tsx` so the shared body file stays under
 * the per-file line cap with both `LinkedWorkoutSection` and the new
 * `ExecutedWorkoutsSection` slots wired up.
 */
import { isMovableSession } from "../../../application/session-movability";
import { AiProcessingOverlay } from "./AiProcessingOverlay";
import type { CoachingDialogBodyProps } from "./coaching-dialog-body-props";
import { DialogGarminDrift } from "./DialogGarminDrift";
import { ExecutedWorkoutsSection } from "./ExecutedWorkoutsSection";
import { LinkedWorkoutSection } from "./LinkedWorkoutSection";
import { MatchedWorkoutActions } from "./MatchedWorkoutActions";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

type MatchedState = Extract<CoachingDialogState, { kind: "matched" }>;

export const renderMatchedBody = (
  props: CoachingDialogBodyProps,
  { workout, executed, executedWorkoutIds, recorded }: MatchedState
) => {
  const movability = isMovableSession({
    workout,
    activity: props.activity,
    executed,
    match: { executedWorkoutIds },
    recorded,
  });
  return (
    <>
      <LinkedWorkoutSection
        workout={workout}
        splitting={props.splitting}
        onSplit={props.onSplit}
      />
      <DialogGarminDrift workout={workout} locked={!movability.movable} />
      {executed.length > 0 ? (
        <ExecutedWorkoutsSection
          executed={executed}
          onOpenExecuted={props.onOpenExecuted}
        />
      ) : null}
      {props.aiProgress ? (
        <AiProcessingOverlay
          progress={props.aiProgress}
          onCancel={props.onAiCancel}
        />
      ) : (
        <MatchedWorkoutActions
          workout={workout}
          splitting={props.splitting}
          onClose={props.onClose}
          onOpenEditor={props.onOpenEditor}
          onAiProcess={props.onAiProcess}
          onPushToGarmin={props.onPushToGarmin}
          onSplit={props.onSplit}
          onRegenerate={props.onRegenerate}
          movability={movability}
          onMoveTo={props.onMoveTo}
        />
      )}
    </>
  );
};

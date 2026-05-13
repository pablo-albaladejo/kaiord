/**
 * Inner JSX for CoachingActivityDialog. Dispatches on the 3-state
 * `dialogState` (per design D5):
 *
 *   - "no-workout" → AI/Manual/Match buttons + AI hint when desc empty.
 *                    Switches to in-flight spinner OR error inline state.
 *   - "converted"  → render as no-workout while auto-heal is in flight.
 *                    The next live-query tick flips to "matched".
 *   - "matched"    → LinkedWorkoutSection + workout-state-conditional
 *                    contextual buttons.
 */

import {
  type CoachingDialogBodyProps,
  renderMatchedBody,
  renderNoWorkoutBody,
} from "./coaching-dialog-body";
import {
  DialogDescription,
  DialogHeader,
  DialogMeta,
  STATUS_LABEL,
} from "./coaching-dialog-parts";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

export type CoachingActivityDialogContentProps = CoachingDialogBodyProps & {
  dialogState: CoachingDialogState | undefined;
};

export function CoachingActivityDialogContent(
  props: CoachingActivityDialogContentProps
) {
  const { activity, dialogState } = props;
  const matched = dialogState?.kind === "matched" ? dialogState : null;
  return (
    <div className="space-y-3">
      <DialogHeader activity={activity} />
      <DialogMeta activity={activity} />
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">
          {STATUS_LABEL[activity.status] ?? activity.status}
        </span>
      </div>
      <DialogDescription activity={activity} />
      {matched
        ? renderMatchedBody(props, matched.workout, matched.executed)
        : renderNoWorkoutBody(props)}
    </div>
  );
}

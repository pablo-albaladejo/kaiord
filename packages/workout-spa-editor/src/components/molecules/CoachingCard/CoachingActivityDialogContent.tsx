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

import { useTranslate } from "../../../i18n/use-translate";
import {
  type CoachingDialogBodyProps,
  renderMatchedBody,
  renderNoWorkoutBody,
} from "./coaching-dialog-body";
import {
  DialogDescription,
  DialogHeader,
  DialogMeta,
} from "./coaching-dialog-parts";
import { CoachingDayComments } from "./CoachingDayComments";
import { useCoachingDayComments } from "./use-coaching-day-comments";
import type { DescriptionLoad } from "./use-coaching-dialog-helpers";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

export type CoachingActivityDialogContentProps = CoachingDialogBodyProps & {
  dialogState: CoachingDialogState | undefined;
  descriptionLoad: DescriptionLoad;
  profileId: string | null;
};

export function CoachingActivityDialogContent(
  props: CoachingActivityDialogContentProps
) {
  const { activity, dialogState, descriptionLoad, profileId } = props;
  const t = useTranslate("coaching");
  const matched = dialogState?.kind === "matched" ? dialogState : null;
  const comments = useCoachingDayComments(
    profileId,
    activity.source,
    activity.date
  );
  return (
    <div className="space-y-3">
      <DialogHeader activity={activity} />
      <DialogMeta activity={activity} />
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">{t(`status.${activity.status}`)}</span>
      </div>
      <DialogDescription activity={activity} load={descriptionLoad} />
      {matched
        ? renderMatchedBody(props, matched.workout, matched.executed)
        : renderNoWorkoutBody(props)}
      <CoachingDayComments comments={comments} />
    </div>
  );
}

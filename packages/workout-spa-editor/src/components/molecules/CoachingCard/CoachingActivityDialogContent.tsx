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
 *
 * The Athlete note ("Your note") sits under the coach's text in every state.
 */

import { formatHms } from "../../../lib/workout-review/format-duration";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { cardDurationSeconds } from "../WorkoutCard/workout-card-labels";
import { AthleteNoteField } from "./AthleteNoteField";
import {
  type CoachingDialogBodyProps,
  renderMatchedBody,
  renderNoWorkoutBody,
} from "./coaching-dialog-body";
import { DialogMeta } from "./coaching-dialog-meta";
import { DialogDescription, DialogHeader } from "./coaching-dialog-parts";
import { CoachingDialogZoneProfile } from "./coaching-dialog-zone-profile";
import { CoachingDayComments } from "./CoachingDayComments";
import { CoachingStepsTable } from "./CoachingStepsTable";
import { useCoachingDayComments } from "./use-coaching-day-comments";
import type { DescriptionLoad } from "./use-coaching-dialog-helpers";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

export type CoachingActivityDialogContentProps = CoachingDialogBodyProps & {
  dialogState: CoachingDialogState | undefined;
  descriptionLoad: DescriptionLoad;
  profileId: string | null;
};

const linkedDurationLabel = (
  workout: WorkoutRecord | null
): string | undefined => {
  const seconds = workout ? cardDurationSeconds(workout) : null;
  return seconds ? formatHms(seconds) : undefined;
};

export function CoachingActivityDialogContent(
  props: CoachingActivityDialogContentProps
) {
  const { activity, dialogState, descriptionLoad, profileId } = props;
  const matched = dialogState?.kind === "matched" ? dialogState : null;
  const linked =
    dialogState && "workout" in dialogState ? dialogState.workout : null;
  const comments = useCoachingDayComments(
    profileId,
    activity.source,
    activity.date
  );
  return (
    <div className="space-y-3">
      <DialogHeader activity={activity} />
      <DialogMeta
        activity={activity}
        duration={activity.duration ?? linkedDurationLabel(linked)}
      />
      <CoachingDialogZoneProfile
        workout={linked}
        description={activity.description}
      />
      <DialogDescription activity={activity} load={descriptionLoad} />
      <CoachingStepsTable steps={activity.structuredSteps} />
      <AthleteNoteField
        key={activity.id}
        profileId={profileId}
        activityId={activity.id}
      />
      {matched ? renderMatchedBody(props, matched) : renderNoWorkoutBody(props)}
      <CoachingDayComments comments={comments} />
    </div>
  );
}

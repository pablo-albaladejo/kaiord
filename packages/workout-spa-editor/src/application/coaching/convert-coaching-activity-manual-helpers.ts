import type { SessionMatchSource } from "../../types/session-match";
import { buildCoachingTemplateKrd } from "./coaching-template";
import type {
  CoachingActivityForConvert,
  ConvertManualDeps,
  ConvertManualResult,
} from "./convert-coaching-activity-manual-types";
import { ensureSessionMatch } from "./ensure-session-match";

export const manualMatchSource: SessionMatchSource = "auto-coaching";

export const handleExistingManualWorkout = async (
  deps: ConvertManualDeps,
  activity: CoachingActivityForConvert,
  existingWorkoutId: string
): Promise<ConvertManualResult> => {
  // If the existing workout was created by the legacy
  // `convertCoachingActivity` it sits in `state="raw"` with `krd=null`
  // and the editor lands on `EditorNoData` ("This workout has no
  // structured data yet") — a dead end. Manual is meant to give the
  // user a non-empty KRD; populate the template here when the existing
  // record is empty so the editor renders a step the user can edit.
  const existing = await deps.workouts.getById(existingWorkoutId);
  if (existing && !existing.krd) {
    await deps.workouts.put({
      ...existing,
      state: "structured",
      krd: buildCoachingTemplateKrd(activity.sport, activity.title),
      updatedAt: deps.clock(),
    });
  }
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: existingWorkoutId,
    date: activity.date,
    source: manualMatchSource,
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  deps.analytics.event("coaching.convert_manual.success", { created: false });
  return { workoutId: existingWorkoutId, created: false };
};

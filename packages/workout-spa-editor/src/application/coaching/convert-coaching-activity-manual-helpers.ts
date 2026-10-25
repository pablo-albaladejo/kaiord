import { resolveT2GSport } from "../../adapters/train2go/train2go-krd-sport";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatchSource } from "../../types/session-match";
import { updateWorkoutRecord } from "../save-workout-edits";
import { buildCoachingTemplateKrd } from "./coaching-template";
import type {
  CoachingActivityForConvert,
  ConvertManualDeps,
  ConvertManualResult,
} from "./convert-coaching-activity-manual-types";
import { ensureSessionMatch } from "./ensure-session-match";
import { sessionMatchDate } from "./session-match-date";

export const manualMatchSource: SessionMatchSource = "auto-coaching";

type Resolved = NonNullable<ReturnType<typeof resolveT2GSport>>;

/**
 * Reads the row inside a transaction and seeds the template onto it when it
 * has no KRD and the sport resolves, so a move made since the first read
 * stays; returns that stored row.
 */
const readStoredRowSeedingTemplate = async (
  deps: ConvertManualDeps,
  activity: CoachingActivityForConvert,
  existing: WorkoutRecord,
  resolved: Resolved | null
): Promise<WorkoutRecord> => {
  let stored = existing;
  await updateWorkoutRecord(deps, existing.id, (fresh) => {
    stored = fresh;
    if (fresh.krd || !resolved) return undefined;
    return {
      ...fresh,
      state: "structured",
      krd: buildCoachingTemplateKrd(
        resolved.sport,
        activity.title,
        resolved.subSport
      ),
      updatedAt: deps.clock(),
    };
  });
  return stored;
};

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
  const resolved = resolveT2GSport(activity.sport);
  // For a rest day (or unknown sport) `resolved` is null: leave the
  // existing raw record untouched rather than seeding a KRD.
  const stored = existing
    ? await readStoredRowSeedingTemplate(deps, activity, existing, resolved)
    : undefined;
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: existingWorkoutId,
    // Dated from the row read inside the write's transaction (AC-27).
    date: stored ? sessionMatchDate(stored, activity) : activity.date,
    source: manualMatchSource,
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  deps.analytics.event("coaching.convert_manual.success", { created: false });
  return { workoutId: existingWorkoutId, created: false };
};

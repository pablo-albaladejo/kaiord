import { computeRawHash } from "../../../lib/raw-hash";
import type { WorkoutRaw } from "../../../types/calendar-fragments";
import {
  createStructuredWorkoutRecord,
  type WorkoutRecord,
} from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";
import { isValidCalendarDate } from "../../../utils/is-valid-calendar-date";
import { todayIsoDate } from "../../../utils/today-iso-date";

export type BuildWorkoutRecordInput = {
  profileId: string;
  sport: string;
  prompt: string;
  title: string;
  krd: KRD;
  /** Schedule target; falls back to today when absent (non-dated entry). */
  date?: string | null;
};

/** Build a persisted WorkoutRecord for an AI-generated session. */
export async function buildWorkoutRecord(
  input: BuildWorkoutRecordInput
): Promise<WorkoutRecord> {
  const raw: WorkoutRaw = {
    title: input.title,
    description: input.prompt,
    comments: [],
    distance: null,
    duration: null,
    prescribedRpe: null,
    rawHash: "",
  };
  raw.rawHash = await computeRawHash(raw);

  const date =
    input.date && isValidCalendarDate(input.date) ? input.date : todayIsoDate();

  return createStructuredWorkoutRecord({
    profileId: input.profileId,
    date,
    sport: input.sport,
    source: "ai-generated",
    krd: input.krd,
    tags: [],
    raw,
  });
}

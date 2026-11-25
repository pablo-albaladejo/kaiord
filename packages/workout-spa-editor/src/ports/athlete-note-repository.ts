import type { AthleteNote } from "../types/athlete-note";

/** Athlete notes, one per Coaching Activity, keyed by the activity's id. */
export type AthleteNoteRepository = {
  getById: (coachingActivityId: string) => Promise<AthleteNote | undefined>;
  put: (note: AthleteNote) => Promise<void>;
  /** Bulk-delete every note of a profile (profile-delete cascade). */
  deleteByProfile: (profileId: string) => Promise<void>;
};

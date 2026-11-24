/**
 * Port — reads one day of the athlete's TrainingPeaks workouts and gives
 * only their titles. The adapter never throws: anything it cannot read is
 * `{ ok: false }`, which proves nothing either way.
 */
export type DayTitles = { ok: true; titles: string[] } | { ok: false };

export type TrainingPeaksDayPort = {
  titlesOn: (day: string) => Promise<DayTitles>;
};

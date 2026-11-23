import { addDaysIso } from "../shared/date-utils";

/** The day TrainingPeaks answers 402 for: past a Basic account's horizon. */
export const TRAININGPEAKS_HORIZON_STATUS = 402;

/** The westernmost UTC offset in use (UTC-12:00), in milliseconds. */
const WESTERNMOST_OFFSET_MS = -12 * 60 * 60 * 1000;

/** The earliest date any time zone is on at this instant. */
const earliestTodayAnywhere = (now: Date): string =>
  new Date(now.getTime() + WESTERNMOST_OFFSET_MS).toISOString().slice(0, 10);

/**
 * A Basic TrainingPeaks account accepts workouts up to tomorrow only, counted
 * in the account's time zone. The Kaiord App knows neither the account type
 * nor its time zone, so it assumes the zone furthest behind: a day after the
 * earliest "tomorrow" anywhere is one TrainingPeaks may refuse. The browser's
 * own zone plays no part, so from ahead of the account it still warns.
 */
export const isPastBasicHorizon = (
  day: string,
  now: Date = new Date()
): boolean => day > addDaysIso(earliestTodayAnywhere(now), 1);

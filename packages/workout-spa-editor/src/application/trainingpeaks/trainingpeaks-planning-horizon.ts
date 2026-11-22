import { addDaysIso } from "../shared/date-utils";

/** The day TrainingPeaks answers 402 for: past a Basic account's horizon. */
export const TRAININGPEAKS_HORIZON_STATUS = 402;

const localIsoDate = (date: Date): string => {
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * A Basic TrainingPeaks account accepts workouts up to tomorrow only. The
 * Kaiord App cannot know the account type (the token exchange does not say
 * it), so every day after tomorrow is one TrainingPeaks may refuse.
 * "Tomorrow" is the browser's; TrainingPeaks counts in the account's
 * timezone, which the App does not know either.
 */
export const isPastBasicHorizon = (
  day: string,
  now: Date = new Date()
): boolean => day > addDaysIso(localIsoDate(now), 1);

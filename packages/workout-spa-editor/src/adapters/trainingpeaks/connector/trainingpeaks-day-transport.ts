/**
 * The read of one day of the athlete's TrainingPeaks workouts, through
 * `request` (protocol 2); the previous protocol has no such action, so it
 * reads nothing there. Only the titles of that day's workouts are kept
 * (`readDayTitles`). Never throws: anything but a readable answer is
 * `{ ok: false }`, which the caller tells the athlete as "could not check".
 */
import { callConnector } from "../../bridge/connector-call";
import { readDayTitles } from "./read-trainingpeaks-answers";
import { readTrainingPeaksAthleteId } from "./trainingpeaks-athlete-transport";
import { workoutsOnDayPath } from "./trainingpeaks-paths";

const READ_DAY_TIMEOUT_MS = 10_000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type DayTitles = { ok: true; titles: string[] } | { ok: false };

const isRealDay = (day: string) => {
  if (!ISO_DAY.test(day)) return false;
  const ms = Date.parse(`${day}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === day;
};

export const readTrainingPeaksDayTitles = async (
  extensionId: string,
  day: string
): Promise<DayTitles> => {
  if (!isRealDay(day)) return { ok: false };
  const athleteId = await readTrainingPeaksAthleteId(extensionId).catch(
    () => null
  );
  if (athleteId === null) return { ok: false };
  const res = await callConnector(
    extensionId,
    {
      method: "GET",
      path: workoutsOnDayPath(athleteId, day),
      read: readDayTitles(day),
    },
    READ_DAY_TIMEOUT_MS
  );
  return res.ok ? { ok: true, titles: res.data as string[] } : { ok: false };
};

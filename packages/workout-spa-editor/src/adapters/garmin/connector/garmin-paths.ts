/**
 * The Garmin Connect paths the Connector asks the Garmin Bridge for, each one
 * an entry of the extension's closed list (checked by
 * hooks/garmin-connector-contract.test.ts against background.js).
 */
export const GARMIN_WORKOUTS_PATH =
  "/workout-service/workouts?start=0&limit=20";
export const GARMIN_WORKOUT_PATH = "/workout-service/workout";
export const GARMIN_UPLOAD_PATH = "/upload-service/upload/.fit";
export const GARMIN_ACTIVITIES_PATH =
  "/activitylist-service/activities/search/activities?start=0&limit=20";

export const garminSchedulePath = (id: string): string =>
  `/workout-service/schedule/${id}`;

// Garmin's month parameter is 0-based: October is month 9.
export const garminMonthPath = (date: string): string =>
  `/calendar-service/year/${date.slice(0, 4)}/month/${Number(date.slice(5, 7)) - 1}`;

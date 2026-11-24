/**
 * The TrainingPeaks API paths the Connector asks the TrainingPeaks Bridge
 * for, each one an entry of the extension's closed list (checked by
 * trainingpeaks-connector-contract.test.ts against background.js). The
 * athlete id comes from the extension's `read-athlete-id`.
 */
export const metricsPath = (
  athleteId: number,
  start: string,
  end: string
): string =>
  `/metrics/v3/athletes/${athleteId}/consolidatedtimedmetrics/${start}/${end}`;

export const workoutsPath = (athleteId: number): string =>
  `/fitness/v6/athletes/${athleteId}/workouts`;

export const workoutPath = (athleteId: number, workoutId: string): string =>
  `${workoutsPath(athleteId)}/${workoutId}`;

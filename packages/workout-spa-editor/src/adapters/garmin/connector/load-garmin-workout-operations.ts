import { lazyImport } from "../../../lib/lazy-import";

/**
 * Sending and listing workouts, loaded on the first send or list instead of
 * with the App: the Garmin provider mounts at boot, and its actions would
 * otherwise carry both into the initial JS.
 */
export const loadGarminWorkoutOperations = () =>
  lazyImport(() => import("./garmin-workout-operations"));

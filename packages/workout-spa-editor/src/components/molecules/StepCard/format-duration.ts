import type { WorkoutStep } from "../../../types/krd";

/**
 * Format duration for display
 */
export const formatDuration = (step: WorkoutStep): string => {
  const { duration, durationType } = step;

  switch (durationType) {
    case "time":
      if ("seconds" in duration) {
        const minutes = Math.floor(duration.seconds / 60);
        const seconds = duration.seconds % 60;
        return seconds > 0
          ? `${minutes}:${seconds.toString().padStart(2, "0")}`
          : `${minutes} min`;
      }
      return "Time";
    case "distance":
      if ("meters" in duration) {
        const km = duration.meters / 1000;
        return km >= 1 ? `${km.toFixed(2)} km` : `${duration.meters} m`;
      }
      return "Distance";
    case "calories":
      if ("calories" in duration) {
        return `${duration.calories} cal`;
      }
      return "Calories";
    case "open":
      return "Open";
    default:
      return durationType.replace(/_/g, " ");
  }
};

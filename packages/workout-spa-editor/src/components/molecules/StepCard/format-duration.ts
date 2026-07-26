import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { WorkoutStep } from "../../../types/krd";

/**
 * Format duration for display
 */
export const formatDuration = (
  step: WorkoutStep,
  t: Translate = getTranslate("editor")
): string => {
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
      return t("duration.time");
    case "distance":
      if ("meters" in duration) {
        const km = duration.meters / 1000;
        return km >= 1 ? `${km.toFixed(2)} km` : `${duration.meters} m`;
      }
      return t("duration.distance");
    case "calories":
      if ("calories" in duration) {
        return `${duration.calories} cal`;
      }
      return t("duration.calories");
    case "open":
      return t("duration.open");
    default:
      return durationType.replace(/_/g, " ");
  }
};

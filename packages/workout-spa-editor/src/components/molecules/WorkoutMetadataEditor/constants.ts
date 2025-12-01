/**
 * WorkoutMetadataEditor Constants
 */

import type { Sport, SubSport } from "../../../types/krd";

export const SPORTS: Sport[] = ["cycling", "running", "swimming", "generic"];

export const SUB_SPORTS: Record<Sport, SubSport[]> = {
  cycling: ["generic", "indoor_cycling", "mountain", "road", "track"],
  running: ["generic", "trail", "track", "treadmill"],
  swimming: ["generic", "lap_swimming", "open_water"],
  generic: ["generic"],
};

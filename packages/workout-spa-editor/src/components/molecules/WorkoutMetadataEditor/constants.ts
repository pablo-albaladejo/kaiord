/**
 * WorkoutMetadataEditor Constants
 */

import type { Sport, SubSport } from "../../../types/krd";
import { sportSchema } from "../../../types/schemas";

// The metadata editor offers the full KRD sport vocabulary so coaching
// activities (Stretching, Gym, Rowing, ...) keep their real sport. The
// library SportFilter and AiWorkoutInput selectors stay curated by design.
export const SPORTS: Sport[] = [...sportSchema.options];

export const SUB_SPORTS: Partial<Record<Sport, SubSport[]>> = {
  cycling: ["generic", "indoor_cycling", "mountain", "road", "track"],
  running: ["generic", "trail", "track", "treadmill"],
  swimming: ["generic", "lap_swimming", "open_water"],
  generic: ["generic"],
};

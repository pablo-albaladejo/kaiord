import { z } from "zod";

/**
 * Zod schema for sub-sport type enumeration.
 *
 * Defines detailed sport subtypes for more specific categorization.
 * Uses snake_case for multi-word values following KRD format conventions.
 *
 * @example
 * ```typescript
 * import { subSportSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const trail = subSportSchema.enum.trail;
 * const indoorCycling = subSportSchema.enum.indoor_cycling;
 *
 * // Validate sub-sport
 * const result = subSportSchema.safeParse('trail');
 * if (result.success) {
 *   console.log('Valid sub-sport:', result.data);
 * }
 * ```
 */
export const subSportSchema = z.enum([
  "generic",
  "treadmill",
  "street",
  "trail",
  "track",
  "spin",
  "indoor_cycling",
  "road",
  "mountain",
  "downhill",
  "recumbent",
  "cyclocross",
  "hand_cycling",
  "track_cycling",
  "indoor_rowing",
  "elliptical",
  "stair_climbing",
  "lap_swimming",
  "open_water",
  "flexibility_training",
  "strength_training",
  "warm_up",
  "match",
  "exercise",
  "challenge",
  "indoor_skiing",
  "cardio_training",
  "indoor_walking",
  "e_bike_fitness",
  "bmx",
  "casual_walking",
  "speed_walking",
  "bike_to_run_transition",
  "run_to_bike_transition",
  "swim_to_bike_transition",
  "atv",
  "motocross",
  "backcountry",
  "resort",
  "rc_drone",
  "wingsuit",
  "whitewater",
  "skate_skiing",
  "yoga",
  "pilates",
  "indoor_running",
  "gravel_cycling",
  "e_bike_mountain",
  "commuting",
  "mixed_surface",
  "navigate",
  "track_me",
  "map",
  "single_gas_diving",
  "multi_gas_diving",
  "gauge_diving",
  "apnea_diving",
  "apnea_hunting",
  "virtual_activity",
  "obstacle",
  "all",
]);

/**
 * TypeScript type for sub-sport, inferred from {@link subSportSchema}.
 *
 * String literal union of supported sub-sport types.
 */
export type SubSport = z.infer<typeof subSportSchema>;

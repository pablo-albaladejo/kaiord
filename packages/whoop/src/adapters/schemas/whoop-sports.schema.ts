import { z } from "zod";

/**
 * Schema for the WHOOP `activities-service/v1/sports/history` catalog: a
 * list of `{ id, name, ... }` sport definitions (203 entries live; `id: -1`
 * is the generic "Activity" fallback). Modelled non-strict: unknown fields
 * (`category`, `activity_type_internal_name`, `has_gps`, `icon_url`, ...)
 * are tolerated. The response is either a bare array or a
 * `{ sports: [...] }` wrapper — both normalize to an array of sports.
 */
export const whoopSportSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const whoopSportsResponseSchema = z
  .union([
    z.array(whoopSportSchema),
    z.object({ sports: z.array(whoopSportSchema) }),
  ])
  .transform((value) => (Array.isArray(value) ? value : value.sports));

export type WhoopSport = z.infer<typeof whoopSportSchema>;
export type WhoopSportsResponse = z.infer<typeof whoopSportsResponseSchema>;

/**
 * Builds an `id -> name` lookup from the sports catalog so
 * `workoutToActivity` can resolve a workout's numeric `sport_id` to a
 * human-readable sport name without depending on the catalog fetch itself.
 */
export const buildSportCatalog = (sports: WhoopSport[]): Map<number, string> =>
  new Map(sports.map((sport) => [sport.id, sport.name]));

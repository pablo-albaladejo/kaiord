/**
 * Resolves the per-day net-balance map for one visible calendar week.
 *
 * For each day in `[weekStart, weekEnd]` it runs `buildDayEnergyBalance` and
 * reduces the result to a badge string (or `null` when the day yields no
 * badge — gated, or resolvable but with untracked intake). Bounded to the
 * seven visible days so the calendar stays performant; the caller memoizes it
 * inside the same per-week `useLiveQuery` subscription.
 */

import { buildDayEnergyBalance } from "../../application/energy/build-day-energy-balance";
import { rangeDatesInclusive } from "../../application/energy/range-dates";
import type { PersistencePort } from "../../ports/persistence-port";
import { netForDay } from "./calendar-net-balance";

export const buildNetByWeek = async (
  persistence: PersistencePort,
  profileId: string,
  weekStart: string,
  weekEnd: string
): Promise<Record<string, string | null>> => {
  const dates = rangeDatesInclusive(weekStart, weekEnd);
  const entries = await Promise.all(
    dates.map(async (date): Promise<[string, string | null]> => {
      const result = await buildDayEnergyBalance({
        persistence,
        profileId,
        date,
      });
      return [date, netForDay(result)];
    })
  );
  return Object.fromEntries(entries);
};

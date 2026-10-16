/**
 * The dominant training zone of the current week — the value `--core-live`
 * takes on the header mark's wrapper (#1118).
 *
 * It is the week the athlete is in, not the week the calendar happens to be
 * showing: the mark is app chrome and is on screen from every route, so a
 * value that changed while paging through past weeks would read as a property
 * of the navigation rather than of the training.
 *
 * The arithmetic lives in `lib/week-dominant-zone`. Returns `null` for a
 * week with nothing classifiable — no sessions, or only
 * raw imports. That is not a failure state: the caller declares no custom
 * property at all and the core inherits the ink the role layer already
 * carries.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { lazyImport } from "../lib/lazy-import";
import type { ZoneNumber } from "../lib/zone-colors";
import type { WorkoutRecord } from "../types/calendar-record";
import type { Profile } from "../types/profile";
import { getCurrentWeekId, parseWeekId } from "../utils/week-utils";

export function useWeekDominantZone(
  profileId: string | null,
  profile: Profile | null
): ZoneNumber | null {
  const range = parseWeekId(getCurrentWeekId());
  const zone = useLiveQuery(async (): Promise<ZoneNumber | null> => {
    if (!range || !profileId) return null;
    const workouts = await db
      .table<WorkoutRecord>("workouts")
      .where("[profileId+date]")
      .between([profileId, range.start], [profileId, range.end], true, true)
      .toArray();
    // The classifier loads after the read, so the header (on screen from
    // every route) keeps it out of the initial JS, and liveQuery has already
    // observed the only table it depends on before the foreign await.
    // A failed load costs the mark its colour, never the header: useLiveQuery
    // rethrows a querier error during render.
    try {
      const { weekDominantZone } = await lazyImport(
        () => import("../lib/week-dominant-zone")
      );
      return weekDominantZone(workouts, profile);
    } catch {
      return null;
    }
  }, [profileId, profile, range?.start, range?.end]);
  return zone ?? null;
}

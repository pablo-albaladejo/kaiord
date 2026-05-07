/**
 * `useSelectedActivity` — keeps the dialog's coaching activity in sync
 * with the live `coaching.byDay` map.
 *
 * The clicked activity is captured by id only. The view-model itself is
 * re-derived on every render so the live-query update from
 * `expandActivity` (which writes the description into Dexie out-of-band)
 * propagates into the open dialog. A plain `useState<CoachingActivity>`
 * would freeze the original reference with `description: undefined` and
 * the dialog would stay on "Loading description…" forever.
 */
import { useCallback, useMemo, useState } from "react";

import type { CoachingActivity } from "../../types/coaching-activity";

export type UseSelectedActivity = {
  selectedActivity: CoachingActivity | null;
  setSelectedActivity: (a: CoachingActivity | null) => void;
};

export const useSelectedActivity = (
  byDay: Record<string, CoachingActivity[]>
): UseSelectedActivity => {
  const [id, setId] = useState<string | null>(null);
  const selectedActivity = useMemo<CoachingActivity | null>(() => {
    if (!id) return null;
    for (const day of Object.values(byDay)) {
      const found = day.find((a) => a.id === id);
      if (found) return found;
    }
    return null;
  }, [id, byDay]);
  const setSelectedActivity = useCallback(
    (a: CoachingActivity | null): void => setId(a?.id ?? null),
    []
  );
  return { selectedActivity, setSelectedActivity };
};

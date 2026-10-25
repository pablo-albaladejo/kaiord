import { useLiveQuery } from "dexie-react-hooks";

import type { OverriddenSession } from "../../../application/coaching/apply-coach-date-moves";
import { readMoveBackEntries } from "../../../application/read-move-back-entries";
import { usePersistence } from "../../../contexts/persistence-context";

/** One live read of the listed workouts (design §3.9); `[]` until it lands. */
export const useMoveBackEntries = (
  profileId: string,
  overridden: readonly OverriddenSession[]
) => {
  const persistence = usePersistence();
  const key = overridden
    .map((o) => `${o.workoutId}@${o.athleteDate}>${o.coachDate}`)
    .join(",");
  return (
    useLiveQuery(
      () => readMoveBackEntries(persistence, profileId, overridden),
      [persistence, profileId, key]
    ) ?? []
  );
};

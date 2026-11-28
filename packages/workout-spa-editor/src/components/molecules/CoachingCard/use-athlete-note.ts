import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";

import { setAthleteNote } from "../../../application/coaching/set-athlete-note";
import { usePersistence } from "../../../contexts/persistence-context";
import { toPersistedCoachingActivityId } from "../../../types/coaching-activity-record";

/**
 * The Athlete note of one Coaching Activity, live, and its writer. `stored`
 * is `undefined` until read, `""` when there is none.
 */
export const useAthleteNote = (
  profileId: string | null,
  activityId: string
) => {
  const persistence = usePersistence();
  const id = profileId
    ? toPersistedCoachingActivityId(profileId, activityId)
    : null;
  const stored = useLiveQuery(
    async () =>
      id ? ((await persistence.athleteNotes.getById(id))?.text ?? "") : "",
    [persistence, id]
  );
  const save = useCallback(
    async (text: string) => {
      if (!profileId || !id) return;
      await setAthleteNote(
        {
          athleteNotes: persistence.athleteNotes,
          clock: () => new Date().toISOString(),
        },
        { profileId, coachingActivityId: id, text }
      );
    },
    [persistence, profileId, id]
  );
  return { stored, save };
};

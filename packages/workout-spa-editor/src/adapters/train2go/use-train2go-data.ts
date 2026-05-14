import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import type { PersistencePort } from "../../ports/persistence-port";
import type { CoachingActivity } from "../../types/coaching-activity";
import { toCoachingActivity } from "./coaching-record-to-activity.converter";

const TRAIN2GO = "train2go";

export const useCoachingActivities = (
  persistence: PersistencePort,
  activeProfileId: string | null,
  days: string[]
): CoachingActivity[] => {
  const start = days[0] ?? "";
  const end = days[days.length - 1] ?? "";
  const records = useLiveQuery(() => {
    if (!activeProfileId || !start || !end) return Promise.resolve([]);
    return persistence.coaching.getByProfileAndDateRange(
      activeProfileId,
      start,
      end
    );
  }, [activeProfileId, start, end]);

  return useMemo(() => (records ?? []).map(toCoachingActivity), [records]);
};

export const useTrain2GoSyncState = (
  persistence: PersistencePort,
  activeProfileId: string | null
): string | undefined => {
  const row = useLiveQuery(() => {
    if (!activeProfileId) return Promise.resolve(undefined);
    return persistence.coachingSyncState.getBySourceAndProfile(
      TRAIN2GO,
      activeProfileId
    );
  }, [activeProfileId]);
  return row?.lastSyncedAt;
};

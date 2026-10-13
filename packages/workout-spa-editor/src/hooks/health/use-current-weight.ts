import { useLiveQuery } from "dexie-react-hooks";

import {
  getCurrentWeightKg,
  loadLatestWeighIn,
} from "../../application/health/current-weight";
import { usePersistence } from "../../contexts/persistence-context";
import type { Profile } from "../../types/profile";
import { todayIsoDate } from "../../utils/today-iso-date";

/** Live current weight (kg): latest weigh-in up to today, else bodyWeight. */
export const useCurrentWeightKg = (
  profileId: string | null | undefined,
  profile: Pick<Profile, "bodyWeight"> | null | undefined
): number | undefined => {
  const persistence = usePersistence();
  const latest = useLiveQuery(
    () =>
      profileId
        ? loadLatestWeighIn(persistence, profileId, todayIsoDate())
        : undefined,
    [persistence, profileId]
  );
  return getCurrentWeightKg(profile ?? undefined, latest);
};

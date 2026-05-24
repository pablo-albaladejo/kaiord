/**
 * useHealthBodyCompositionLatestLive — reactive read of the most
 * recent body-composition record for a profile (by `date`).
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthBodyCompositionRecord } from "../../types/health/health-records";
import { queryHealthLatestAsync } from "./health-live-query";

export const useHealthBodyCompositionLatestLive = (
  profileId: string
): HealthBodyCompositionRecord | undefined =>
  useLiveQuery<HealthBodyCompositionRecord | undefined>(
    () =>
      queryHealthLatestAsync<HealthBodyCompositionRecord>(
        "healthBodyComposition",
        profileId
      ),
    [profileId]
  );

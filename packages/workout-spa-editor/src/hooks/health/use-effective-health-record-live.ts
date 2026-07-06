/**
 * useEffectiveHealthRecordLive — reactive read of the resolver's
 * (F3.2) effective record for (profileId, dataType, day).
 *
 * Backed by the real import-policy repo (reconciliation invariant) and the
 * real Dexie-backed `dataTypeSourcePolicy` companion table (F3.1): an
 * absent row resolves as the "union" default, i.e. "nobody has set a
 * multi-source preference yet".
 */
import type { ManagedDataType } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import { getHealthRecordsForDay } from "../../application/data-source-policy/get-health-records-for-day";
import {
  resolveEffectiveSource,
  type ResolveEffectiveSourceResult,
} from "../../application/data-source-policy/resolve-effective-source.use-case";
import { usePersistence } from "../../contexts/persistence-context";

export function useEffectiveHealthRecordLive<T>(
  profileId: string,
  dataType: ManagedDataType,
  day: string
): ResolveEffectiveSourceResult<T> | undefined {
  const persistence = usePersistence();
  return useLiveQuery(
    () =>
      resolveEffectiveSource<T>(
        {
          sourcePolicyRepo: persistence.dataTypeSourcePolicy,
          policyRepo: persistence.integrationPolicy,
          getRecordsForDay: (input) =>
            getHealthRecordsForDay<T>(persistence, input),
        },
        { profileId, dataType, day }
      ),
    [profileId, dataType, day, persistence]
  );
}

/**
 * useEffectiveHealthRecordLive — reactive read of the resolver's
 * (F3.2) effective record for (profileId, dataType, day).
 *
 * Uses the real import-policy repo for the reconciliation invariant,
 * but a null source-policy repo for now: the Dexie-backed companion
 * table lands in F3.1 (deferred to avoid colliding with the other
 * executor's in-flight v28/v29 migrations). Until then every
 * (profileId, dataType) resolves as "union" — the correct default for
 * "nobody has set a multi-source preference yet", just not durable.
 * Swap this for the real repo once F3.1's Dexie adapter exists.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import type { DataTypeSourcePolicyRepository } from "../../application/data-source-policy/data-type-source-policy-repository.port";
import { getHealthRecordsForDay } from "../../application/data-source-policy/get-health-records-for-day";
import {
  resolveEffectiveSource,
  type ResolveEffectiveSourceResult,
} from "../../application/data-source-policy/resolve-effective-source.use-case";
import { usePersistence } from "../../contexts/persistence-context";

const NULL_SOURCE_POLICY_REPO: DataTypeSourcePolicyRepository = {
  findByProfileAndType: async () => undefined,
  put: async () => undefined,
};

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
          sourcePolicyRepo: NULL_SOURCE_POLICY_REPO,
          policyRepo: persistence.integrationPolicy,
          getRecordsForDay: (input) =>
            getHealthRecordsForDay<T>(persistence, input),
        },
        { profileId, dataType, day }
      ),
    [profileId, dataType, day, persistence]
  );
}

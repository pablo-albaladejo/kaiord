/**
 * getEffectiveSourceToday — today's effective health source for one
 * managed data type, summarized for the chat hub tools. Reuses the F3.2
 * multi-source resolver; only health-record-backed types have a
 * meaningful answer (everything else is undefined).
 */
import type { ManagedDataType } from "@kaiord/core";

import type { PersistencePort } from "../../../ports/persistence-port";
import {
  getHealthRecordsForDay,
  HEALTH_REPO_KEY_FOR_TYPE,
} from "../../data-source-policy/get-health-records-for-day";
import {
  resolveEffectiveSource,
  type ResolveEffectiveSourceResult,
} from "../../data-source-policy/resolve-effective-source.use-case";

export type EffectiveSourceAnswer =
  | { mode: "union"; sources: string[] }
  | { mode: "priority"; effectiveSource?: string; usedFallback: boolean };

const summarize = (
  result: ResolveEffectiveSourceResult<unknown>
): EffectiveSourceAnswer =>
  result.mode === "union"
    ? { mode: "union", sources: result.records.map((r) => r.sourceBridgeId) }
    : {
        mode: "priority",
        effectiveSource: result.effective?.sourceBridgeId,
        usedFallback: result.usedFallback,
      };

export const getEffectiveSourceToday = async (
  persistence: PersistencePort,
  profileId: string,
  dataType: ManagedDataType,
  day: string
): Promise<EffectiveSourceAnswer | undefined> => {
  if (!(dataType in HEALTH_REPO_KEY_FOR_TYPE)) return undefined;
  const result = await resolveEffectiveSource<unknown>(
    {
      sourcePolicyRepo: persistence.dataTypeSourcePolicy,
      policyRepo: persistence.integrationPolicy,
      getRecordsForDay: (i) => getHealthRecordsForDay(persistence, i),
    },
    { profileId, dataType, day }
  );
  return summarize(result);
};

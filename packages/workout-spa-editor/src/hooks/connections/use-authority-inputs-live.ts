/**
 * One live read of what decides each kind for the active athlete: their
 * import routes, their stored Authority choices and what they were already
 * told (`authorityDeciders`). `undefined` until all three are read, so no
 * reader takes a half-loaded state for a change.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../adapters/dexie/dexie-database";
import type { AuthorityDeciders } from "../../application/connections/authority-change";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { UserPreferences } from "../../types/user-preferences";
import { type DataFlowsByType, groupByDataType } from "./use-data-flows";

export type AuthorityInputs = {
  readonly byDataType: DataFlowsByType;
  readonly stored: readonly DataTypeSourcePolicy[];
  readonly seen: AuthorityDeciders;
};

export const useAuthorityInputsLive = (
  profileId: string | null
): AuthorityInputs | undefined =>
  useLiveQuery(async () => {
    if (profileId === null) return undefined;
    const [policies, stored, prefs] = await Promise.all([
      db
        .table<IntegrationPolicy>("integrationPolicies")
        .where("profileId")
        .equals(profileId)
        .toArray(),
      db
        .table<DataTypeSourcePolicy>("dataTypeSourcePolicy")
        .where("profileId")
        .equals(profileId)
        .toArray(),
      db.table<UserPreferences>("userPreferences").get(profileId),
    ]);
    return {
      byDataType: groupByDataType(policies),
      stored,
      seen: prefs?.authorityDeciders ?? {},
    };
  }, [profileId]);

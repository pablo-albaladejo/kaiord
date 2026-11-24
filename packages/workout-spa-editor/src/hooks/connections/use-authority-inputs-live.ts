/**
 * One live read of what decides each kind for the active athlete: their
 * import routes, their stored Authority choices and what they were already
 * told (`authorityDeciders`). `undefined` until all three are read, so no
 * reader takes a half-loaded state for a change.
 */
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../adapters/dexie/dexie-database";
import type { AuthorityDeciders } from "../../application/connections/authority-change";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { UserPreferences } from "../../types/user-preferences";
import type { DataFlowsByType } from "./use-data-flows";

export type AuthorityInputs = {
  readonly byDataType: DataFlowsByType;
  readonly stored: readonly DataTypeSourcePolicy[];
  readonly seen: AuthorityDeciders;
};

/** The same grouping `useDataFlows` reads with 26 queries, from one. */
export const groupImports = (
  policies: readonly IntegrationPolicy[]
): DataFlowsByType =>
  new Map(
    managedDataTypes.map((dataType) => [
      dataType,
      {
        import: MANAGED_DATA_REGISTRY[dataType].capabilities.import
          ? policies.filter(
              (p) => p.dataType === dataType && p.direction === "import"
            )
          : [],
        export: [],
      },
    ])
  );

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
      byDataType: groupImports(policies),
      stored,
      seen: prefs?.authorityDeciders ?? {},
    };
  }, [profileId]);

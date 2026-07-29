/**
 * useDataTypeSourcePolicies — the profile's raw DataTypeSourcePolicy rows.
 *
 * One `useLiveQuery` shared by every surface that needs per-type multi-source
 * semantics: the Data Hub's priority editor (which then narrows to 2+ source
 * types) and the Connections page's routing rows (which do not). Keeping the
 * query in one place stops the two from drifting on what "no row" means.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../adapters/dexie/dexie-database";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";

const EMPTY: DataTypeSourcePolicy[] = [];

export const useDataTypeSourcePolicies = (
  profileId: string | null
): readonly DataTypeSourcePolicy[] => {
  const policies = useLiveQuery(async (): Promise<DataTypeSourcePolicy[]> => {
    if (!profileId) return EMPTY;
    return db
      .table<DataTypeSourcePolicy>("dataTypeSourcePolicy")
      .where("profileId")
      .equals(profileId)
      .toArray();
  }, [profileId]);

  return policies ?? EMPTY;
};

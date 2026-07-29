/**
 * One `useLiveQuery` for the profile's raw policy rows, so the surfaces that
 * read them cannot drift on what an absent row means.
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

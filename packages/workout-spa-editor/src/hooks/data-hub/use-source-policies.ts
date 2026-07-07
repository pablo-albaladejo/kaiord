/**
 * useSourcePolicies — reactive rows for the Data Hub multi-source editor
 * (F4.1). Joins the profile's live IntegrationPolicy import routes (via
 * useDataFlows) with its DataTypeSourcePolicy rows, keeping only the data
 * types that currently have 2+ enabled import sources.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import {
  buildSourcePolicyRows,
  type SourcePolicyRow,
} from "../../application/data-hub/source-policy-rows";
import { useDataFlows } from "../../components/organisms/ProfileManager/components/useDataFlows";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";

const EMPTY: DataTypeSourcePolicy[] = [];

export const useSourcePolicies = (
  profileId: string | null
): SourcePolicyRow[] => {
  const { byDataType } = useDataFlows(profileId ?? "");
  const policies = useLiveQuery(async (): Promise<DataTypeSourcePolicy[]> => {
    if (!profileId) return EMPTY;
    return db
      .table<DataTypeSourcePolicy>("dataTypeSourcePolicy")
      .where("profileId")
      .equals(profileId)
      .toArray();
  }, [profileId]);

  return useMemo(
    () => buildSourcePolicyRows(byDataType, policies ?? EMPTY),
    [byDataType, policies]
  );
};

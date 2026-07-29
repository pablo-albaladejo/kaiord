/**
 * useSourcePolicies — reactive rows for the Data Hub multi-source editor
 * (F4.1). Joins the profile's live IntegrationPolicy import routes (via
 * useDataFlows) with its DataTypeSourcePolicy rows, keeping only the data
 * types that currently have 2+ enabled import sources.
 */
import { useMemo } from "react";

import {
  buildSourcePolicyRows,
  type SourcePolicyRow,
} from "../../application/data-hub/source-policy-rows";
import { useDataFlows } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { useDataTypeSourcePolicies } from "./use-data-type-source-policies";

export const useSourcePolicies = (
  profileId: string | null
): SourcePolicyRow[] => {
  const { byDataType } = useDataFlows(profileId ?? "");
  const policies = useDataTypeSourcePolicies(profileId);

  return useMemo(
    () => buildSourcePolicyRows(byDataType, policies),
    [byDataType, policies]
  );
};

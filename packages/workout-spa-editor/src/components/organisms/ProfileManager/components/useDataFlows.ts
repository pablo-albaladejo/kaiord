/**
 * useDataFlows — reactive read of IntegrationPolicy rows for a profile,
 * grouped by data type and direction via useLiveQuery (Dexie-backed).
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../../adapters/dexie/dexie-integration-policy-repository";
import type { IntegrationPolicy } from "../../../../types/integration-policy";

const policyRepo = createDexieIntegrationPolicyRepository(db);

export type DataFlowsByType = Map<
  ManagedDataType,
  { import: IntegrationPolicy[]; export: IntegrationPolicy[] }
>;

export type UseDataFlowsResult = {
  policies: IntegrationPolicy[];
  byDataType: DataFlowsByType;
  hasAny: boolean;
};

const EMPTY: UseDataFlowsResult = {
  policies: [],
  byDataType: new Map(),
  hasAny: false,
};

export function useDataFlows(profileId: string): UseDataFlowsResult {
  const result = useLiveQuery(async (): Promise<UseDataFlowsResult> => {
    const all: IntegrationPolicy[] = [];
    const byDataType: DataFlowsByType = new Map();

    for (const dt of managedDataTypes) {
      const reg = MANAGED_DATA_REGISTRY[dt];
      const imports = reg.capabilities.import
        ? await policyRepo.findByProfileDirection({
            profileId,
            dataType: dt,
            direction: "import",
          })
        : [];
      const exports = reg.capabilities.export
        ? await policyRepo.findByProfileDirection({
            profileId,
            dataType: dt,
            direction: "export",
          })
        : [];
      all.push(...imports, ...exports);
      byDataType.set(dt, { import: imports, export: exports });
    }

    return { policies: all, byDataType, hasAny: all.length > 0 };
  }, [profileId]);

  return result ?? EMPTY;
}

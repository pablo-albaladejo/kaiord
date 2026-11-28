/**
 * useDataFlows — reactive read of IntegrationPolicy rows for a profile,
 * grouped by data type and direction via useLiveQuery (Dexie-backed).
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import type { IntegrationPolicy } from "../../types/integration-policy";
import { policyRepo } from "../integration-policy-repo";

export type DataFlowsByType = Map<
  ManagedDataType,
  { import: IntegrationPolicy[]; export: IntegrationPolicy[] }
>;

export type UseDataFlowsResult = {
  policies: IntegrationPolicy[];
  byDataType: DataFlowsByType;
  hasAny: boolean;
};

/** A profile's routes grouped by data type and direction; a direction the
    registry gives a type no capability for stays empty. */
export const groupByDataType = (
  policies: readonly IntegrationPolicy[]
): DataFlowsByType =>
  new Map(
    managedDataTypes.map((dt) => {
      const { capabilities } = MANAGED_DATA_REGISTRY[dt];
      const routes = (direction: "import" | "export") =>
        capabilities[direction]
          ? policies.filter(
              (p) => p.dataType === dt && p.direction === direction
            )
          : [];
      return [dt, { import: routes("import"), export: routes("export") }];
    })
  );

const EMPTY: UseDataFlowsResult = {
  policies: [],
  byDataType: new Map(),
  hasAny: false,
};

export function useDataFlows(profileId: string): UseDataFlowsResult {
  const result = useLiveQuery(async (): Promise<UseDataFlowsResult> => {
    // Callers on a profile-less surface pass "", which no policy row can
    // match: answer without issuing 26 queries for a key that cannot exist.
    if (profileId === "") return EMPTY;
    const all: IntegrationPolicy[] = [];
    for (const dt of managedDataTypes) {
      const reg = MANAGED_DATA_REGISTRY[dt];
      for (const direction of ["import", "export"] as const) {
        if (!reg.capabilities[direction]) continue;
        all.push(
          ...(await policyRepo.findByProfileDirection({
            profileId,
            dataType: dt,
            direction,
          }))
        );
      }
    }
    const byDataType = groupByDataType(all);

    return { policies: all, byDataType, hasAny: all.length > 0 };
  }, [profileId]);

  return result ?? EMPTY;
}

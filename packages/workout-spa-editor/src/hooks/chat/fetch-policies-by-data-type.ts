import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import type { IntegrationPolicy } from "../../types/integration-policy";

export type PoliciesByDataType = Map<
  ManagedDataType,
  { import: IntegrationPolicy[]; export: IntegrationPolicy[] }
>;

/** One pass over the managed types, skipping a direction the type has no
    capability token for so no query is issued for a route that cannot exist. */
export const fetchPoliciesByDataType = async (
  persistence: PersistencePort,
  profileId: string
): Promise<PoliciesByDataType> => {
  const byDataType: PoliciesByDataType = new Map();
  for (const dataType of managedDataTypes) {
    const reg = MANAGED_DATA_REGISTRY[dataType];
    const [imports, exports] = await Promise.all([
      reg.capabilities.import
        ? persistence.integrationPolicy.findByProfileDirection({
            profileId,
            dataType,
            direction: "import",
          })
        : Promise.resolve([]),
      reg.capabilities.export
        ? persistence.integrationPolicy.findByProfileDirection({
            profileId,
            dataType,
            direction: "export",
          })
        : Promise.resolve([]),
    ]);
    byDataType.set(dataType, { import: imports, export: exports });
  }
  return byDataType;
};

/**
 * Port — IntegrationPolicyRepository
 *
 * Abstract contract for reading and writing IntegrationPolicy rows.
 * The Dexie implementation lives in adapters/dexie/; use cases depend
 * only on this interface (R-AppDexieImport rule).
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicy } from "../../types/integration-policy";

export type IntegrationPolicyRepository = {
  findByProfileDirection: (input: {
    profileId: string;
    dataType: ManagedDataType;
    direction: "import" | "export";
  }) => Promise<IntegrationPolicy[]>;
  findByNaturalKey: (input: {
    profileId: string;
    dataType: ManagedDataType;
    direction: "import" | "export";
    bridgeId: string;
  }) => Promise<IntegrationPolicy | undefined>;
  put: (policy: IntegrationPolicy) => Promise<void>;
  deleteById: (id: string) => Promise<void>;
};

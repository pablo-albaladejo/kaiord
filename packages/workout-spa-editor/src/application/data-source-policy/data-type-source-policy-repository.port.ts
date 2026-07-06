/**
 * Port — DataTypeSourcePolicyRepository
 *
 * Abstract contract for reading and writing DataTypeSourcePolicy rows
 * (companion table, keyed by [profileId+dataType]). The Dexie
 * implementation lives in adapters/dexie/; use cases depend only on
 * this interface (R-AppDexieImport rule).
 */
import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";

export type DataTypeSourcePolicyRepository = {
  findByProfileAndType: (input: {
    profileId: string;
    dataType: ManagedDataType;
  }) => Promise<DataTypeSourcePolicy | undefined>;
  put: (policy: DataTypeSourcePolicy) => Promise<void>;
};

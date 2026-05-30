import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../adapters/dexie/dexie-integration-policy-repository";
import type {
  IntegrationPolicy,
  IntegrationPolicyDirection,
} from "../../../types/integration-policy";

const repo = createDexieIntegrationPolicyRepository(db);

type ToggleArgs = {
  profileId: string;
  bridgeId: string;
  dataType: ManagedDataType;
  direction: IntegrationPolicyDirection;
  next: boolean;
};

/* Upsert + bridge-disable writes for connection flows. useLiveQuery
   (useDataFlows) re-renders on commit, so we never set local state here. */
export function usePolicyToggle() {
  const toggleFlow = useCallback(async (args: ToggleArgs) => {
    const { profileId, bridgeId, dataType, direction, next } = args;
    const existing = await repo.findByNaturalKey({
      profileId,
      dataType,
      direction,
      bridgeId,
    });
    const policy: IntegrationPolicy = {
      id: existing?.id ?? crypto.randomUUID(),
      profileId,
      dataType,
      bridgeId,
      direction,
      mode: existing?.mode ?? "manual",
      enabled: next,
      updatedAt: new Date().toISOString(),
    };
    await repo.put(policy);
  }, []);

  const disableBridge = useCallback(async (policies: IntegrationPolicy[]) => {
    const now = new Date().toISOString();
    for (const policy of policies) {
      await repo.put({ ...policy, enabled: false, updatedAt: now });
    }
  }, []);

  return { toggleFlow, disableBridge };
}

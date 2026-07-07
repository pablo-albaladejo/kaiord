import { useCallback } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../adapters/dexie/dexie-integration-policy-repository";
import type { IntegrationPolicy } from "../../../types/integration-policy";

const repo = createDexieIntegrationPolicyRepository(db);

/* Bridge-disable write for account disconnect. useLiveQuery (useDataFlows)
   re-renders on commit, so we never set local state here. Per-flow toggle
   writes used to live here too; that surface moved to the Data Hub matrix
   (F4.2, useDataHubToggle) — this hook now only backs disconnect. */
export function usePolicyToggle() {
  const disableBridge = useCallback(async (policies: IntegrationPolicy[]) => {
    const now = new Date().toISOString();
    for (const policy of policies) {
      await repo.put({ ...policy, enabled: false, updatedAt: now });
    }
  }, []);

  return { disableBridge };
}

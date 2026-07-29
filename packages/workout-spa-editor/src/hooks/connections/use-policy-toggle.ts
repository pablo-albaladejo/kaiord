import { useCallback } from "react";

import type { IntegrationPolicy } from "../../types/integration-policy";
import { policyRepo as repo } from "../integration-policy-repo";

/* Bridge-disable write for account disconnect. useLiveQuery (useDataFlows)
   re-renders on commit, so we never set local state here. This hook only backs
   disconnect: per-flow toggle writes were retired with the Data Hub matrix. */
export function usePolicyToggle() {
  const disableBridge = useCallback(async (policies: IntegrationPolicy[]) => {
    const now = new Date().toISOString();
    for (const policy of policies) {
      await repo.put({ ...policy, enabled: false, updatedAt: now });
    }
  }, []);

  return { disableBridge };
}

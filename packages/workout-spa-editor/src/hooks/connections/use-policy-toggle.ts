import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import { upsertIntegrationPolicy } from "../../application/integration-policy/upsert-integration-policy.use-case";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { policyRepo as repo } from "../integration-policy-repo";

export type SetImportRouteInput = {
  readonly profileId: string;
  readonly dataType: ManagedDataType;
  readonly bridgeId: string;
  readonly enabled: boolean;
};

/* The two IntegrationPolicy writes the Connections page performs. useLiveQuery
   (useDataFlows) re-renders on commit, so neither ever sets local state here.

   `disableBridge` backs account disconnect: every route the bridge feeds goes
   off at once. `setImportRoute` backs one routing row's on/off control, and is
   the only non-assistant way to switch importing ON — a profile whose seed
   migration already ran gets no policy for an extension installed afterwards,
   so without it a newly-installed bridge has no reachable path into the rows. */
export function usePolicyToggle() {
  const disableBridge = useCallback(async (policies: IntegrationPolicy[]) => {
    const now = new Date().toISOString();
    for (const policy of policies) {
      await repo.put({ ...policy, enabled: false, updatedAt: now });
    }
  }, []);

  const setImportRoute = useCallback(
    async ({ profileId, dataType, bridgeId, enabled }: SetImportRouteInput) => {
      // The stored mode is preserved rather than reasserted: a route the user
      // (or the assistant) set to `manual` must not silently become `auto`
      // because it was switched off and on again from here.
      const existing = await repo.findByNaturalKey({
        profileId,
        dataType,
        direction: "import",
        bridgeId,
      });
      await upsertIntegrationPolicy(
        { policyRepo: repo },
        {
          profileId,
          dataType,
          bridgeId,
          direction: "import",
          mode: existing?.mode ?? "auto",
          enabled,
        }
      );
    },
    []
  );

  return { disableBridge, setImportRoute };
}

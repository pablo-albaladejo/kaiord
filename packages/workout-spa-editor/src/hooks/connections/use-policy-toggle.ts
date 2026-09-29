import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import { upsertIntegrationPolicy } from "../../application/integration-policy/upsert-integration-policy.use-case";
import type {
  IntegrationPolicy,
  IntegrationPolicyDirection,
} from "../../types/integration-policy";
import { policyRepo as repo } from "../integration-policy-repo";

export type SetRouteInput = {
  readonly profileId: string;
  readonly dataType: ManagedDataType;
  readonly bridgeId: string;
  readonly enabled: boolean;
};

const setRoute = async (
  input: SetRouteInput,
  direction: IntegrationPolicyDirection
): Promise<void> => {
  const { profileId, dataType, bridgeId, enabled } = input;
  // The stored mode is preserved rather than reasserted: a route the user
  // (or the assistant) set to `manual` must not silently become `auto`
  // because it was switched off and on again from here.
  const existing = await repo.findByNaturalKey({
    profileId,
    dataType,
    direction,
    bridgeId,
  });
  await upsertIntegrationPolicy(
    { policyRepo: repo },
    {
      profileId,
      dataType,
      bridgeId,
      direction,
      mode: existing?.mode ?? "auto",
      enabled,
    }
  );
};

/* The IntegrationPolicy writes the Connections page performs. useLiveQuery
   (useDataFlows) re-renders on commit, so neither ever sets local state here.

   `disableBridge` backs account disconnect: every route the bridge feeds goes
   off at once. `setImportRoute` backs one routing row's on/off control, and is
   the only non-assistant way to switch importing ON — a profile whose seed
   migration already ran gets no policy for an extension installed afterwards,
   so without it a newly-installed bridge has no reachable path into the rows.
   `setExportRoute` is its export twin: the seed migration only covers profiles
   that existed with a Garmin signal, so a new profile had no UI path to send
   workouts anywhere. */
export function usePolicyToggle() {
  const disableBridge = useCallback(async (policies: IntegrationPolicy[]) => {
    const now = new Date().toISOString();
    for (const policy of policies) {
      await repo.put({ ...policy, enabled: false, updatedAt: now });
    }
  }, []);

  const setImportRoute = useCallback(
    (input: SetRouteInput) => setRoute(input, "import"),
    []
  );

  const setExportRoute = useCallback(
    (input: SetRouteInput) => setRoute(input, "export"),
    []
  );

  return { disableBridge, setImportRoute, setExportRoute };
}

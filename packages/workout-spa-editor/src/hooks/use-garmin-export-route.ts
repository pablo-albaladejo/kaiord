/**
 * Whether the profile has an enabled `workout` export route to the Garmin
 * Bridge, live. `undefined` while the policies load.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { resolveExportPolicies } from "../application/integration-policy/resolve-export-policies.use-case";
import { GARMIN_BRIDGE_ID } from "./garmin-push-fn";
import { policyRepo } from "./integration-policy-repo";

export function useGarminExportRoute(
  profileId: string | null | undefined
): boolean | undefined {
  return useLiveQuery(
    async () =>
      profileId
        ? (
            await resolveExportPolicies(
              { policyRepo },
              { profileId, dataType: "workout" }
            )
          ).some((p) => p.enabled && p.bridgeId === GARMIN_BRIDGE_ID)
        : false,
    [profileId]
  );
}

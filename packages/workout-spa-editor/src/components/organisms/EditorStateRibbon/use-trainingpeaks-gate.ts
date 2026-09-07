/**
 * Whether this workout can reach TrainingPeaks, and which link is missing.
 *
 * Modelled on `useGarminGate`, with one deliberate difference: it does not
 * gate on the session. TrainingPeaks has no bridge context holding a live
 * session flag, and probing for one would fire a network call on every render.
 * The session is checked inside the push instead, where a dead one surfaces as
 * a re-login message the athlete can act on.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { resolveExportPolicies } from "../../../application/integration-policy/resolve-export-policies.use-case";
import { TRAININGPEAKS_BRIDGE_ID } from "../../../application/trainingpeaks/trainingpeaks-weight-import";
import { policyRepo } from "../../../hooks/integration-policy-repo";
import { useDiscoveredBridges } from "../../../hooks/use-discovered-bridges";

export type TrainingPeaksGate = "no-extension" | "export-disabled" | "ready";

export function useTrainingPeaksGate(
  profileId: string | undefined
): TrainingPeaksGate {
  const discovered = useDiscoveredBridges();
  const exportPolicies = useLiveQuery(
    () =>
      profileId
        ? resolveExportPolicies(
            { policyRepo },
            { profileId, dataType: "workout" }
          )
        : Promise.resolve([]),
    [profileId]
  );

  if (!discovered.some((d) => d.bridgeId === TRAININGPEAKS_BRIDGE_ID)) {
    return "no-extension";
  }

  const hasEnabledPolicy =
    Array.isArray(exportPolicies) &&
    exportPolicies.some(
      (p) => p.enabled && p.bridgeId === TRAININGPEAKS_BRIDGE_ID
    );
  if (!hasEnabledPolicy) return "export-disabled";

  return "ready";
}

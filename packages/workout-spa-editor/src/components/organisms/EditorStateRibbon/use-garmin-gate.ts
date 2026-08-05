/**
 * Resolves the one question the editor's send path depends on: can this
 * workout reach the watch, and if not, which link in the chain is broken?
 *
 * Sole owner of that decision. `GarminPushButton` used to answer it inline
 * and render `null` for the first failure, which is why the most common
 * cause — no bridge extension — was the one the screen never named.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { resolveExportPolicies } from "../../../application/integration-policy/resolve-export-policies.use-case";
import { useGarminBridge } from "../../../contexts";
import { policyRepo } from "../../../hooks/integration-policy-repo";

const GARMIN_BRIDGE_ID = "garmin-bridge";

export type GarminGate =
  "no-extension" | "export-disabled" | "no-session" | "ready";

export function useGarminGate(profileId: string | undefined): GarminGate {
  const { extensionInstalled, sessionActive } = useGarminBridge();
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

  if (!extensionInstalled) return "no-extension";

  const hasEnabledPolicy =
    Array.isArray(exportPolicies) &&
    exportPolicies.some((p) => p.enabled && p.bridgeId === GARMIN_BRIDGE_ID);
  if (!hasEnabledPolicy) return "export-disabled";

  if (!sessionActive) return "no-session";

  return "ready";
}

/**
 * Resolves the one question the editor's send path depends on: can this
 * workout reach the watch, and if not, which link in the chain is broken?
 *
 * Sole owner of that decision. A missing extension is named before the route,
 * because nothing else can be fixed first; every other Connection state comes
 * after it, so a route that is off is not hidden behind a sign-in.
 */

import { useLiveQuery } from "dexie-react-hooks";

import type { ConnectionState } from "../../../application/connections/connection-state";
import { resolveExportPolicies } from "../../../application/integration-policy/resolve-export-policies.use-case";
import { useGarminBridge } from "../../../contexts";
import { policyRepo } from "../../../hooks/integration-policy-repo";

const GARMIN_BRIDGE_ID = "garmin-bridge";

/** "ready", the route switched off, or the Connection's own state (its
    notice and fix come from `connectionNotice`). */
export type GarminGate =
  "ready" | "export-disabled" | Exclude<ConnectionState, "working">;

export function useGarminGate(profileId: string | undefined): GarminGate {
  const { connection } = useGarminBridge();
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

  if (connection === "not-installed" || connection === "checking") {
    return connection;
  }

  const hasEnabledPolicy =
    Array.isArray(exportPolicies) &&
    exportPolicies.some((p) => p.enabled && p.bridgeId === GARMIN_BRIDGE_ID);
  if (!hasEnabledPolicy) return "export-disabled";

  return connection === "working" ? "ready" : connection;
}

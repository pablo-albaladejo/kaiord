/**
 * seedImportRoutesOnLink — opens the import routes a source feeds the moment
 * the user explicitly links it.
 *
 * The v29 migration seeded routes only for profiles that existed when it ran,
 * so a profile linked afterwards synced nothing (`route-inactive`) with no hint
 * why. Which routes to open comes from the registry: every data type whose
 * import token the bridge announces and the SPA actually serves.
 *
 * First it restores what a Disconnect of this bridge switched off (every
 * direction, see `restoreDisconnectedRoutes`). Past that it only seeds: a row
 * that already exists — above all a disabled one without the Disconnect
 * marker, which is the user's explicit "off" — is never touched.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";

import { eligibleBridgeIds } from "../../integrations/integration-registry";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";
import { restoreDisconnectedRoutes } from "./restore-disconnected-routes.use-case";
import { upsertIntegrationPolicy } from "./upsert-integration-policy.use-case";

export type SeedImportRoutesInput = {
  readonly profileId: string;
  readonly bridgeId: string;
  readonly capabilities: readonly string[];
};

const DATA_TYPES = Object.keys(MANAGED_DATA_REGISTRY) as ManagedDataType[];

export const seedImportRoutesOnLink = async (
  deps: IntegrationPolicyDeps,
  { profileId, bridgeId, capabilities }: SeedImportRoutesInput
): Promise<ManagedDataType[]> => {
  await restoreDisconnectedRoutes(deps, { profileId, bridgeId });
  const capabilitiesFor = (id: string) => (id === bridgeId ? capabilities : []);
  const seeded: ManagedDataType[] = [];
  for (const dataType of DATA_TYPES) {
    if (!eligibleBridgeIds(dataType, "import", capabilitiesFor).length) {
      continue;
    }
    const key = { profileId, dataType, direction: "import" as const, bridgeId };
    if (await deps.policyRepo.findByNaturalKey(key)) continue;
    await upsertIntegrationPolicy(deps, {
      ...key,
      mode: "auto",
      enabled: true,
    });
    seeded.push(dataType);
  }
  return seeded;
};

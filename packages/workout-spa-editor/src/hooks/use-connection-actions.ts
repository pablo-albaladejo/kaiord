/**
 * useConnectionActions — connect/disconnect orchestration for the Athlete
 * Connections UI. `disconnect` is the real account-unlink (#714, D3): it clears
 * the provider's connection record/credential AND disables that provider's
 * integration-policy flows. Credentials are encrypted with a device-bound key.
 */
import { useCallback, useMemo } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createConnectionProvider } from "../adapters/connections/create-connection-provider";
import { createDexieConnectionRepository } from "../adapters/dexie/dexie-connection-repository";
import { db } from "../adapters/dexie/dexie-database";
import { seedImportRoutesOnLink } from "../application/integration-policy/seed-import-routes-on-link.use-case";
import { INTEGRATION_REGISTRY } from "../integrations/integration-registry";
import { getDeviceId } from "../lib/cloud-sync/device-id";
import { createConnectionCredentials } from "../lib/connections/connection-credentials";
import type { ConnectionMechanism } from "../types/connection";
import type { IntegrationPolicy } from "../types/integration-policy";
import { usePolicyToggle } from "./connections/use-policy-toggle";
import { policyRepo } from "./integration-policy-repo";

/* An explicit (re)connect opens the import routes the bridge feeds when no
   policy exists yet; a disabled row — the user's "off" — stays off. */
const seedBridgeRoutes = async (profileId: string, providerId: string) => {
  const bridgeId = INTEGRATION_REGISTRY.find(
    (e) => e.id === providerId
  )?.bridgeId;
  if (!bridgeId) return;
  await seedImportRoutesOnLink(
    { policyRepo },
    {
      profileId,
      bridgeId,
      capabilities: bridgeDiscovery.getCapabilities(bridgeId) ?? [],
    }
  );
};

export function useConnectionActions(profileId: string | null) {
  const { disableBridge } = usePolicyToggle();
  const deps = useMemo(
    () => ({
      repository: createDexieConnectionRepository(db),
      credentials: createConnectionCredentials(getDeviceId),
      clock: () => new Date().toISOString(),
    }),
    []
  );

  const connect = useCallback(
    async (
      providerId: string,
      mechanism: ConnectionMechanism,
      credential?: string
    ): Promise<void> => {
      if (!profileId) return;
      const provider = createConnectionProvider(providerId, mechanism, deps);
      await provider.connect({ profileId, credential });
      await seedBridgeRoutes(profileId, providerId);
    },
    [profileId, deps]
  );

  const disconnect = useCallback(
    async (
      providerId: string,
      mechanism: ConnectionMechanism,
      policies: IntegrationPolicy[]
    ): Promise<void> => {
      if (!profileId) return;
      const provider = createConnectionProvider(providerId, mechanism, deps);
      await provider.disconnect(profileId);
      await disableBridge(policies);
    },
    [profileId, deps, disableBridge]
  );

  return { connect, disconnect };
}

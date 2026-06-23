/**
 * useConnectionActions — connect/disconnect orchestration for the Athlete
 * Connections UI. `disconnect` is the real account-unlink (#714, D3): it clears
 * the provider's connection record/credential AND disables that provider's
 * integration-policy flows. Credentials are encrypted with a device-bound key.
 */
import { useCallback, useMemo } from "react";

import { createConnectionProvider } from "../adapters/connections/create-connection-provider";
import { createDexieConnectionRepository } from "../adapters/dexie/dexie-connection-repository";
import { db } from "../adapters/dexie/dexie-database";
import { usePolicyToggle } from "../components/organisms/AthleteConnections/use-policy-toggle";
import { getDeviceId } from "../lib/cloud-sync/device-id";
import { createConnectionCredentials } from "../lib/connections/connection-credentials";
import type { ConnectionMechanism } from "../types/connection";
import type { IntegrationPolicy } from "../types/integration-policy";

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

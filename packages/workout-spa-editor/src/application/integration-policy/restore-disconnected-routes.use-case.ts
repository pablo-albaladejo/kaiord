/**
 * restoreDisconnectedRoutes — on a reconnect, switches back on every route of
 * the bridge that a Disconnect switched off (`disabledBy: "disconnect"`), in
 * either direction and with its stored mode. The upsert drops the marker. A
 * row the user switched off carries no marker and stays off.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type { IntegrationPolicyDirection } from "../../types/integration-policy";
import { DISABLED_BY_DISCONNECT } from "../../types/integration-policy";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";
import { upsertIntegrationPolicy } from "./upsert-integration-policy.use-case";

const DATA_TYPES = Object.keys(MANAGED_DATA_REGISTRY) as ManagedDataType[];
const DIRECTIONS: readonly IntegrationPolicyDirection[] = ["import", "export"];

export const restoreDisconnectedRoutes = async (
  deps: IntegrationPolicyDeps,
  { profileId, bridgeId }: { profileId: string; bridgeId: string }
): Promise<void> => {
  for (const dataType of DATA_TYPES) {
    for (const direction of DIRECTIONS) {
      const key = { profileId, dataType, direction, bridgeId };
      const row = await deps.policyRepo.findByNaturalKey(key);
      if (row?.disabledBy !== DISABLED_BY_DISCONNECT) continue;
      await upsertIntegrationPolicy(deps, {
        ...key,
        mode: row.mode,
        enabled: true,
      });
    }
  }
};

/**
 * disableRoutesOnDisconnect — switches off every route on a bridge whose
 * account is being disconnected, and marks each row it switched off so a
 * reconnect restores exactly those (see `restoreDisconnectedRoutes`).
 *
 * A row that is already off is left untouched: it records the user's own
 * decision, and marking it would let a reconnect switch it back on.
 */
import type { IntegrationPolicy } from "../../types/integration-policy";
import { DISABLED_BY_DISCONNECT } from "../../types/integration-policy";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";

export const disableRoutesOnDisconnect = async (
  deps: IntegrationPolicyDeps,
  policies: readonly IntegrationPolicy[]
): Promise<void> => {
  const updatedAt = new Date().toISOString();
  for (const policy of policies) {
    if (!policy.enabled) continue;
    await deps.policyRepo.put({
      ...policy,
      enabled: false,
      disabledBy: DISABLED_BY_DISCONNECT,
      updatedAt,
    });
  }
};

/**
 * upsertIntegrationPolicy — natural-key upsert on
 * [profileId+dataType+direction+bridgeId].
 *
 * If a row already exists for that composite key, updates mode/enabled/
 * updatedAt in place. If not, inserts a new row with a fresh id.
 * Validates input against the integrationPolicySchema (minus id/updatedAt)
 * so callers receive a ZodError for invalid dataType/direction/mode values.
 */
import type { IntegrationPolicy } from "../../types/integration-policy";
import { integrationPolicySchema } from "../../types/integration-policy";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";

export type NewIntegrationPolicy = Omit<IntegrationPolicy, "id" | "updatedAt">;

const inputSchema = integrationPolicySchema.omit({ id: true, updatedAt: true });

export const upsertIntegrationPolicy = async (
  deps: IntegrationPolicyDeps,
  input: NewIntegrationPolicy
): Promise<IntegrationPolicy> => {
  inputSchema.parse(input);

  const existing = await deps.policyRepo.findByNaturalKey({
    profileId: input.profileId,
    dataType: input.dataType,
    direction: input.direction,
    bridgeId: input.bridgeId,
  });

  const now = new Date().toISOString();

  if (existing) {
    const updated: IntegrationPolicy = {
      ...existing,
      mode: input.mode,
      enabled: input.enabled,
      updatedAt: now,
    };
    await deps.policyRepo.put(updated);

    const action =
      input.enabled !== existing.enabled
        ? input.enabled
          ? "enabled"
          : "disabled"
        : input.mode !== existing.mode
          ? "mode_changed"
          : "enabled";
    const extraProps = action === "mode_changed" ? { newMode: input.mode } : {};
    deps.analytics?.event("integration_policy.toggled", {
      profileId: input.profileId,
      dataType: input.dataType,
      direction: input.direction,
      bridgeId: input.bridgeId,
      action,
      ...extraProps,
    });

    return updated;
  }

  const row: IntegrationPolicy = {
    ...input,
    id: crypto.randomUUID(),
    updatedAt: now,
  };
  await deps.policyRepo.put(row);

  deps.analytics?.event("integration_policy.toggled", {
    profileId: input.profileId,
    dataType: input.dataType,
    direction: input.direction,
    bridgeId: input.bridgeId,
    action: "added",
  });

  return row;
};

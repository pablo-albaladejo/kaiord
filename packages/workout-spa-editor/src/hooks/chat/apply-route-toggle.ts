/**
 * Applies enable_route/disable_route: upserts the IntegrationPolicy row
 * for the resolved bridge, preserving its existing mode, and returns the
 * resulting state so the assistant can confirm it in natural language.
 */
import type { SetDataRouteInput } from "../../application/chat/tools/chat-tool-deps";
import { upsertIntegrationPolicy } from "../../application/integration-policy/upsert-integration-policy.use-case";
import type { PersistencePort } from "../../ports/persistence-port";
import { resolveBridgeId } from "./resolve-integration-key";

export type RouteToggleInput = Extract<
  SetDataRouteInput,
  { action: "enable_route" | "disable_route" }
>;

export const applyRouteToggle = async (
  persistence: PersistencePort,
  profileId: string,
  input: RouteToggleInput
): Promise<unknown> => {
  const bridgeId = resolveBridgeId(input.integrationId);
  if (!bridgeId) {
    return {
      error: "integration_not_bridged",
      integrationId: input.integrationId,
    };
  }

  const existing = await persistence.integrationPolicy.findByNaturalKey({
    profileId,
    dataType: input.dataType,
    direction: input.direction,
    bridgeId,
  });
  const updated = await upsertIntegrationPolicy(
    { policyRepo: persistence.integrationPolicy },
    {
      profileId,
      dataType: input.dataType,
      bridgeId,
      direction: input.direction,
      mode: existing?.mode ?? "auto",
      enabled: input.action === "enable_route",
    }
  );
  return {
    dataType: updated.dataType,
    integrationId: input.integrationId,
    direction: updated.direction,
    enabled: updated.enabled,
    mode: updated.mode,
  };
};

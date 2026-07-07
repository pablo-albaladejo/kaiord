/**
 * Resolves the chat-facing INTEGRATION_REGISTRY id (e.g. "whoop") to the
 * IntegrationPolicy/DataTypeSourcePolicy storage key (the bridge id, e.g.
 * "whoop-bridge") used by `set_data_route`.
 */
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";

const MANUAL_SOURCE_ID = "manual";

/** IntegrationPolicy rows only exist for real bridges — manual is always
    active by product decision and has no route to toggle (F1.0/F4.1). */
export const resolveBridgeId = (integrationId: string): string | undefined =>
  INTEGRATION_REGISTRY.find((entry) => entry.id === integrationId)?.bridgeId ??
  undefined;

/** DataTypeSourcePolicy.sourceOrder additionally accepts "manual" — the
    always-on source key resolveEffectiveSource exempts from the
    enabled-import-policy filter (F3.2 reconciliation invariant). */
export const resolveSourceKey = (integrationId: string): string | undefined =>
  integrationId === MANUAL_SOURCE_ID
    ? MANUAL_SOURCE_ID
    : resolveBridgeId(integrationId);

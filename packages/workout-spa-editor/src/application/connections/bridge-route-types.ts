/**
 * The managed data types a bridge actually moves, in one direction.
 *
 * Both filters are required. The announced capability token alone over-claims
 * (`read:body` spans five types) and the manifest alone lies outright —
 * `trainingpeaks-bridge` announces `write:body` while the SPA cables no
 * export for it, so a manifest-derived "pushes back" chip would be false.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { IntegrationPolicyDirection } from "../../types/integration-policy";

export type BridgeRouteSignals = {
  announces: (bridgeId: string, token: string) => boolean;
  supportsRoute: (
    bridgeId: string,
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection
  ) => boolean;
};

export const bridgeRouteTypes = (
  bridgeId: string,
  direction: IntegrationPolicyDirection,
  signals: BridgeRouteSignals
): ManagedDataType[] =>
  managedDataTypes.filter((dataType) => {
    const token = MANAGED_DATA_REGISTRY[dataType].capabilities[direction];
    return (
      token !== undefined &&
      signals.announces(bridgeId, token) &&
      signals.supportsRoute(bridgeId, dataType, direction)
    );
  });

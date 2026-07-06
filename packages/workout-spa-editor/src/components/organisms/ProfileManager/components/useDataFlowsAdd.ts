import type { ManagedDataType } from "@kaiord/core";
import { useState } from "react";

import { bridgeDiscovery } from "../../../../adapters/bridge/bridge-discovery";
import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../../adapters/dexie/dexie-integration-policy-repository";
import { upsertIntegrationPolicy } from "../../../../application/integration-policy/upsert-integration-policy.use-case";
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import { eligibleBridgeIds } from "../../../../integrations/integration-registry";
import type { IntegrationPolicyDirection } from "../../../../types/integration-policy";

const policyRepo = createDexieIntegrationPolicyRepository(db);

type Params = {
  profileId: string;
  dataType: ManagedDataType;
  direction: IntegrationPolicyDirection;
  discoveredBridges: readonly DiscoveredBridge[];
  onClose: () => void;
};

export function useDataFlowsAdd({
  profileId,
  dataType,
  direction,
  discoveredBridges,
  onClose,
}: Params) {
  const eligible = eligibleBridgeIds(dataType, direction, (bridgeId) =>
    bridgeDiscovery.getCapabilities(bridgeId) ?? []
  );
  const [bridgeId, setBridgeId] = useState<string>(eligible[0] ?? "");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [enabled, setEnabled] = useState(true);
  const isDiscovered = discoveredBridges.some((b) => b.bridgeId === bridgeId);

  const handleAdd = async () => {
    if (!bridgeId) return;
    await upsertIntegrationPolicy(
      { policyRepo },
      { profileId, dataType, bridgeId, direction, mode, enabled }
    );
    onClose();
  };

  return {
    eligible,
    bridgeId,
    setBridgeId,
    mode,
    setMode,
    enabled,
    setEnabled,
    isDiscovered,
    handleAdd,
  };
}

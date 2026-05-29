import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";
import { useState } from "react";

import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../../adapters/dexie/dexie-integration-policy-repository";
import { upsertIntegrationPolicy } from "../../../../application/integration-policy/upsert-integration-policy.use-case";
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { IntegrationPolicyDirection } from "../../../../types/integration-policy";

const policyRepo = createDexieIntegrationPolicyRepository(db);
const KNOWN_BRIDGE_IDS = ["garmin-bridge", "train2go-bridge"] as const;

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
  const capToken = MANAGED_DATA_REGISTRY[dataType].capabilities[direction];
  const eligible = KNOWN_BRIDGE_IDS.filter(() => capToken !== undefined);
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

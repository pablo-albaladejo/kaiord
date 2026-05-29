/**
 * DataFlowsSection — top-level section rendered on the "Data Flows" tab.
 * Reads all integration policies for the active profile; shows a zero-state
 * banner when none exist, otherwise renders one DataFlowsGroup per managed
 * data type.
 */
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import { useDiscoveredBridges } from "../../../../hooks/use-discovered-bridges";
import { DataFlowsGroup } from "./DataFlowsGroup";
import { useDataFlows } from "./useDataFlows";

type Props = {
  profileId: string;
};

export function DataFlowsSection({ profileId }: Props) {
  const { byDataType, hasAny } = useDataFlows(profileId);
  const allBridges = useDiscoveredBridges();

  return (
    <div data-testid="data-flows-section" className="space-y-3">
      <h3 className="text-sm font-semibold">Data Flows</h3>
      {!hasAny ? (
        <p
          data-testid="data-flows-zero-state"
          className="rounded border border-dashed p-4 text-center text-sm text-gray-400"
        >
          Connect a bridge to start syncing data with kaiord
        </p>
      ) : (
        managedDataTypes.map((dt) => {
          const reg = MANAGED_DATA_REGISTRY[dt];
          const hasCaps =
            reg.capabilities.import !== undefined ||
            reg.capabilities.export !== undefined;
          if (!hasCaps) return null;
          return (
            <DataFlowsGroup
              key={dt}
              profileId={profileId}
              dataType={dt}
              policies={byDataType.get(dt) ?? { import: [], export: [] }}
              allBridges={allBridges}
            />
          );
        })
      )}
    </div>
  );
}

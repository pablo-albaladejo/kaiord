/**
 * DataFlowsSection — top-level section rendered on the "Data Flows" tab.
 * Renders one DataFlowsGroup per managed data type whenever at least one
 * bridge has been discovered, so the "+ Add source/destination" affordances
 * are reachable even before any policy exists. The zero-state banner is keyed
 * on bridge presence (not policy count): it shows only when no bridge is
 * connected — otherwise a fresh profile would dead-end with no way to create
 * its first data flow.
 */
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import { useDiscoveredBridges } from "../../../../hooks/use-discovered-bridges";
import { DataFlowsGroup } from "./DataFlowsGroup";
import { useDataFlows } from "./useDataFlows";

type Props = {
  profileId: string;
};

export function DataFlowsSection({ profileId }: Props) {
  const { byDataType } = useDataFlows(profileId);
  const allBridges = useDiscoveredBridges();
  const hasBridge = allBridges.length > 0;

  return (
    <div data-testid="data-flows-section" className="space-y-3">
      <h3 className="text-sm font-semibold">Data Flows</h3>
      {!hasBridge ? (
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

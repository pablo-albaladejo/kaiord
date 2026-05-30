import { useState } from "react";

import { useDiscoveredBridges } from "../../../hooks/use-discovered-bridges";
import { SectionHead } from "../../molecules/SectionHead";
import { useDataFlows } from "../ProfileManager/components/useDataFlows";
import { AvailableRow } from "./AvailableRow";
import { ConnectedRow } from "./ConnectedRow";
import { type ConnectionConfig, CONNECTIONS } from "./connection-config";

export type AthleteConnectionsProps = {
  profileId: string;
};

function isConnected(
  config: ConnectionConfig,
  bridgeIds: ReadonlySet<string>
): boolean {
  return config.bridgeId !== null && bridgeIds.has(config.bridgeId);
}

export function AthleteConnections({ profileId }: AthleteConnectionsProps) {
  const bridges = useDiscoveredBridges();
  const { byDataType } = useDataFlows(profileId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const bridgeIds = new Set(bridges.map((bridge) => bridge.bridgeId));

  return (
    <div>
      <SectionHead title="Connections" />
      <div className="space-y-2.5">
        {CONNECTIONS.map((config) =>
          isConnected(config, bridgeIds) && config.bridgeId ? (
            <ConnectedRow
              key={config.id}
              profileId={profileId}
              config={config}
              bridgeId={config.bridgeId}
              byDataType={byDataType}
              expanded={expandedId === config.id}
              onToggleExpanded={() =>
                setExpandedId((current) =>
                  current === config.id ? null : config.id
                )
              }
            />
          ) : (
            <AvailableRow key={config.id} config={config} />
          )
        )}
      </div>
    </div>
  );
}

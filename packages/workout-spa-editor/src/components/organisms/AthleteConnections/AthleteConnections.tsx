import { useConnectionStatus } from "../../../hooks/use-connection-status";
import { useDiscoveredBridges } from "../../../hooks/use-discovered-bridges";
import { SectionHead } from "../../molecules/SectionHead";
import { useDataFlows } from "../ProfileManager/components/useDataFlows";
import { ApiKeyRow } from "./ApiKeyRow";
import { AvailableRow } from "./AvailableRow";
import { ConnectedRow } from "./ConnectedRow";
import { type ConnectionConfig, CONNECTIONS } from "./connection-config";
import { NotSupportedRow } from "./NotSupportedRow";

export type AthleteConnectionsProps = {
  profileId: string;
};

function bridgeConnected(
  config: ConnectionConfig,
  bridgeIds: ReadonlySet<string>
): boolean {
  return config.bridgeId !== null && bridgeIds.has(config.bridgeId);
}

export function AthleteConnections({ profileId }: AthleteConnectionsProps) {
  const bridges = useDiscoveredBridges();
  const { byDataType } = useDataFlows(profileId);
  const status = useConnectionStatus(profileId);
  const bridgeIds = new Set(bridges.map((bridge) => bridge.bridgeId));

  const renderRow = (config: ConnectionConfig) => {
    if (config.mechanism === "not-supported")
      return <NotSupportedRow key={config.id} config={config} />;
    if (config.mechanism === "api-key")
      return (
        <ApiKeyRow
          key={config.id}
          profileId={profileId}
          config={config}
          connected={status.get(config.id)?.status === "connected"}
        />
      );
    if (bridgeConnected(config, bridgeIds) && config.bridgeId)
      return (
        <ConnectedRow
          key={config.id}
          profileId={profileId}
          config={config}
          bridgeId={config.bridgeId}
          byDataType={byDataType}
        />
      );
    return <AvailableRow key={config.id} config={config} />;
  };

  return (
    <div>
      <SectionHead title="Connections" />
      <div className="space-y-2.5">{CONNECTIONS.map(renderRow)}</div>
    </div>
  );
}

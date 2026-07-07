import type { ManagedDataType } from "@kaiord/core";

import type { DataHubCell } from "../../../application/data-hub/build-data-hub-matrix";
import { useDataHubMatrix } from "../../../hooks/data-hub/use-data-hub-matrix";
import { useDataHubRouteEditor } from "../../../hooks/data-hub/use-data-hub-route-editor";
import { useDataHubToggle } from "../../../hooks/data-hub/use-data-hub-toggle";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useConnectionStatus } from "../../../hooks/use-connection-status";
import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";
import type { IntegrationPolicyMode } from "../../../types/integration-policy";
import { DataHubLegend } from "./DataHubLegend";
import { DataHubMatrix } from "./DataHubMatrix";
import { DataHubSourcePriority } from "./DataHubSourcePriority";

export const DataHubTab: React.FC = () => {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const connections = useConnectionStatus(profileId);
  const rows = useDataHubMatrix(profileId);
  const onToggle = useDataHubToggle(profileId);
  const routeEditor = useDataHubRouteEditor(profileId);

  const onSetMode = (
    dataType: ManagedDataType,
    bridgeId: string,
    cell: DataHubCell,
    mode: IntegrationPolicyMode
  ) => {
    void routeEditor.setMode(dataType, cell.direction, bridgeId, mode);
  };
  const onRemove = (routeId: string) => {
    void routeEditor.remove(routeId);
  };

  if (!profileId)
    return (
      <p
        className="text-sm text-gray-500 dark:text-gray-400"
        data-testid="data-hub-no-profile"
      >
        Select or create a profile to route your health &amp; fitness data.
      </p>
    );

  return (
    <div className="space-y-4" data-testid="data-hub-tab">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Choose where each type of data flows to and from. Every state reflects
        your live connections — never a guess.
      </p>
      <DataHubMatrix
        rows={rows}
        integrations={INTEGRATION_REGISTRY}
        connections={connections}
        onToggle={onToggle}
        onSetMode={onSetMode}
        onRemove={onRemove}
      />
      <DataHubLegend />
      <DataHubSourcePriority profileId={profileId} />
    </div>
  );
};

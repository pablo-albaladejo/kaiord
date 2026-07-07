import { useDataHubMatrix } from "../../../hooks/data-hub/use-data-hub-matrix";
import { useDataHubToggle } from "../../../hooks/data-hub/use-data-hub-toggle";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useConnectionStatus } from "../../../hooks/use-connection-status";
import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";
import { DataHubLegend } from "./DataHubLegend";
import { DataHubMatrix } from "./DataHubMatrix";

export const DataHubTab: React.FC = () => {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const connections = useConnectionStatus(profileId);
  const rows = useDataHubMatrix(profileId);
  const onToggle = useDataHubToggle(profileId);

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
      />
      <DataHubLegend />
    </div>
  );
};

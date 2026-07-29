import { isSourceConnected } from "../../../application/connections/connected-source";
import type {
  DataHubRemoveHandler,
  DataHubRow,
  DataHubSetModeHandler,
  DataHubToggleHandler,
} from "../../../application/data-hub/build-data-hub-matrix";
import type { IntegrationRegistryEntry } from "../../../integrations/integration-registry";
import type { ConnectionRecord } from "../../../types/connection";
import { DataHubColumnHeader } from "./DataHubColumnHeader";
import { DataHubMatrixRow } from "./DataHubMatrixRow";

type Props = {
  rows: readonly DataHubRow[];
  integrations: readonly IntegrationRegistryEntry[];
  connections: ReadonlyMap<string, ConnectionRecord>;
  /** Bridge ids whose extension is currently discovered. A header used to read
      the connection record alone, which no code path ever sets to `connected`
      for a bridge, so every bridge column said "Not connected" above cells the
      same matrix was rendering as active. */
  discovered: ReadonlySet<string>;
  onToggle: DataHubToggleHandler;
  onSetMode: DataHubSetModeHandler;
  onRemove: DataHubRemoveHandler;
};

export const DataHubMatrix: React.FC<Props> = ({
  rows,
  integrations,
  connections,
  discovered,
  onToggle,
  onSetMode,
  onRemove,
}) => (
  <div className="overflow-x-auto" data-testid="data-hub-matrix">
    <table className="w-full min-w-max border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="p-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Data type
          </th>
          {integrations.map((integration) => (
            <DataHubColumnHeader
              key={integration.id}
              integration={integration}
              connected={isSourceConnected(
                integration,
                connections.get(integration.id),
                (bridgeId) => discovered.has(bridgeId)
              )}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <DataHubMatrixRow
            key={row.dataType}
            row={row}
            integrations={integrations}
            onToggle={onToggle}
            onSetMode={onSetMode}
            onRemove={onRemove}
          />
        ))}
      </tbody>
    </table>
  </div>
);

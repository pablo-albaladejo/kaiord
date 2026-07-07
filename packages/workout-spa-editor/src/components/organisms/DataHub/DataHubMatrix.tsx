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
  onToggle: DataHubToggleHandler;
  onSetMode: DataHubSetModeHandler;
  onRemove: DataHubRemoveHandler;
};

export const DataHubMatrix: React.FC<Props> = ({
  rows,
  integrations,
  connections,
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
              connected={
                connections.get(integration.id)?.status === "connected"
              }
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

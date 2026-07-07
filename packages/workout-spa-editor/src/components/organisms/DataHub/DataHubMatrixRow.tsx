import type {
  DataHubRemoveHandler,
  DataHubRow,
  DataHubSetModeHandler,
  DataHubToggleHandler,
} from "../../../application/data-hub/build-data-hub-matrix";
import type { IntegrationRegistryEntry } from "../../../integrations/integration-registry";
import { DataHubCell } from "./DataHubCell";

type Props = {
  row: DataHubRow;
  integrations: readonly IntegrationRegistryEntry[];
  onToggle: DataHubToggleHandler;
  onSetMode: DataHubSetModeHandler;
  onRemove: DataHubRemoveHandler;
};

export const DataHubMatrixRow: React.FC<Props> = ({
  row,
  integrations,
  onToggle,
  onSetMode,
  onRemove,
}) => (
  <tr
    className="border-b border-gray-100 dark:border-gray-800"
    data-testid={`data-hub-row-${row.dataType}`}
  >
    <th
      scope="row"
      className="whitespace-nowrap p-2 text-left font-medium text-gray-900 dark:text-white"
    >
      {row.label}
    </th>
    {integrations.map((integration) => (
      <td key={integration.id} className="p-2 align-top">
        <div className="flex flex-col items-center gap-1">
          {row.cells
            .filter((cell) => cell.integrationId === integration.id)
            .map((cell) => (
              <DataHubCell
                key={cell.direction}
                dataType={row.dataType}
                bridgeId={integration.bridgeId}
                cell={cell}
                onToggle={onToggle}
                onSetMode={onSetMode}
                onRemove={onRemove}
              />
            ))}
        </div>
      </td>
    ))}
  </tr>
);

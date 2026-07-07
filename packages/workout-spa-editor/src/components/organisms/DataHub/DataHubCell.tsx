import type { ManagedDataType } from "@kaiord/core";

import type {
  DataHubCell as Cell,
  DataHubRemoveHandler,
  DataHubSetModeHandler,
  DataHubToggleHandler,
} from "../../../application/data-hub/build-data-hub-matrix";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { CELL_VISUALS } from "./data-hub-cell-visuals";
import { DataHubCellMenu } from "./DataHubCellMenu";

type Props = {
  dataType: ManagedDataType;
  bridgeId: string | null;
  cell: Cell;
  onToggle: DataHubToggleHandler;
  onSetMode: DataHubSetModeHandler;
  onRemove: DataHubRemoveHandler;
};

const BASE =
  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium";

export const DataHubCell: React.FC<Props> = ({
  dataType,
  bridgeId,
  cell,
  onToggle,
  onSetMode,
  onRemove,
}) => {
  const visual = CELL_VISUALS[cell.state];
  if (cell.state === "na") return null;

  const arrow =
    cell.direction === "import" ? ICON_MAP.arrowDown : ICON_MAP.arrowUp;
  const verb = cell.direction === "import" ? "Import" : "Export";
  const label = `${verb} — ${visual.label}`;
  const testId = `data-hub-cell-${dataType}-${cell.integrationId}-${cell.direction}`;
  const body = (
    <>
      <Icon icon={arrow} size="xs" color="inherit" />
      <span>{visual.label}</span>
    </>
  );

  const routeId = cell.routeId;

  if (visual.actionable && bridgeId)
    return (
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label={label}
          title={label}
          data-testid={testId}
          data-state={cell.state}
          onClick={() => {
            void onToggle(dataType, bridgeId, cell);
          }}
          className={`${BASE} ${visual.className}`}
        >
          {body}
        </button>
        {routeId && (
          <DataHubCellMenu
            testId={testId}
            mode={cell.routeMode ?? "auto"}
            onSetMode={(mode) => onSetMode(dataType, bridgeId, cell, mode)}
            onRemove={() => onRemove(routeId)}
          />
        )}
      </div>
    );

  return (
    <span
      aria-label={label}
      title={label}
      data-testid={testId}
      data-state={cell.state}
      className={`${BASE} ${visual.className}`}
    >
      {body}
    </span>
  );
};

import type { ManagedDataType } from "@kaiord/core";

import type {
  DataHubCell as Cell,
  DataHubRemoveHandler,
  DataHubSetModeHandler,
  DataHubToggleHandler,
} from "../../../application/data-hub/build-data-hub-matrix";
import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { CELL_VISUALS } from "./data-hub-cell-visuals";
import { DataHubActionableCell } from "./DataHubActionableCell";

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
  const t = useTranslate("data-hub");
  const visual = CELL_VISUALS[cell.state];
  if (cell.state === "na") return null;

  const arrow =
    cell.direction === "import" ? ICON_MAP.arrowDown : ICON_MAP.arrowUp;
  const cellLabel = t(`cell.${cell.state}`);
  const label = `${t(`direction.${cell.direction}`)} — ${cellLabel}`;
  const testId = `data-hub-cell-${dataType}-${cell.integrationId}-${cell.direction}`;
  const body = (
    <>
      <Icon icon={arrow} size="xs" color="inherit" />
      <span>{cellLabel}</span>
    </>
  );

  if (visual.actionable && bridgeId)
    return (
      <DataHubActionableCell
        className={`${BASE} ${visual.className}`}
        label={label}
        testId={testId}
        state={cell.state}
        onClick={() => void onToggle(dataType, bridgeId, cell)}
        routeId={cell.routeId}
        mode={cell.routeMode ?? "auto"}
        onSetMode={(mode) => onSetMode(dataType, bridgeId, cell, mode)}
        onRemove={onRemove}
      >
        {body}
      </DataHubActionableCell>
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

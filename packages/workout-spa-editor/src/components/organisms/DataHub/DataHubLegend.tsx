import type { DataHubCellState } from "../../../application/data-hub/build-data-hub-matrix";
import { useTranslate } from "../../../i18n/use-translate";
import { CELL_VISUALS } from "./data-hub-cell-visuals";

const LEGEND: ReadonlyArray<DataHubCellState> = [
  "active",
  "available",
  "not-connected",
  "manual",
  "aspirational",
];

export const DataHubLegend: React.FC = () => {
  const t = useTranslate("data-hub");
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
      {LEGEND.map((state) => (
        <div key={state} className="flex items-center gap-1.5">
          <dt
            className={`rounded px-1.5 py-0.5 font-medium ${CELL_VISUALS[state].className}`}
          >
            {t(`cell.${state}`)}
          </dt>
          <dd>{t(`legend.${state}`)}</dd>
        </div>
      ))}
    </dl>
  );
};

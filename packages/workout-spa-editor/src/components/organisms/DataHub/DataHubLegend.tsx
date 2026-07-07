import type { DataHubCellState } from "../../../application/data-hub/build-data-hub-matrix";
import { CELL_VISUALS } from "./data-hub-cell-visuals";

const LEGEND: ReadonlyArray<{ state: DataHubCellState; hint: string }> = [
  { state: "active", hint: "Syncing — click to turn off" },
  { state: "available", hint: "Ready — click to turn on" },
  { state: "not-connected", hint: "Connect this integration first" },
  { state: "manual", hint: "Entered by hand in the app" },
  { state: "aspirational", hint: "Not supported yet" },
];

export const DataHubLegend: React.FC = () => (
  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
    {LEGEND.map(({ state, hint }) => (
      <div key={state} className="flex items-center gap-1.5">
        <dt
          className={`rounded px-1.5 py-0.5 font-medium ${CELL_VISUALS[state].className}`}
        >
          {CELL_VISUALS[state].label}
        </dt>
        <dd>{hint}</dd>
      </div>
    ))}
  </dl>
);

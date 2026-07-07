/**
 * DataFlowsSubsection — Sources or Destinations list within a DataFlowsGroup.
 * Read/edit only (mode, enabled, remove) — creating a new route lives
 * exclusively in the Data Hub matrix (F4.2, /settings/data-hub).
 */
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { IntegrationPolicy } from "../../../../types/integration-policy";
import { DataFlowsRow } from "./DataFlowsRow";

type Props = {
  label: string;
  rows: IntegrationPolicy[];
  allBridges: readonly DiscoveredBridge[];
  emptyText: string;
};

export function DataFlowsSubsection({
  label,
  rows,
  allBridges,
  emptyText,
}: Props) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {rows.map((p) => (
            <DataFlowsRow key={p.id} policy={p} allBridges={allBridges} />
          ))}
        </div>
      )}
    </div>
  );
}
